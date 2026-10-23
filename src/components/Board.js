import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { N, NEIGHBORS, SIZE } from '../board';
import { colors } from '../theme';

export default function Board({ grid, onChange, onSubmit, disabled }) {
  const { width } = useWindowDimensions();
  const size = Math.min(width - 32, 400);
  const cell = size / SIZE;

  const [path, setPath] = useState([]);
  const pathRef = useRef([]);
  const cellRef = useRef(cell);
  cellRef.current = cell;
  const props = useRef({});
  props.current = { grid, onChange, onSubmit, disabled };

  const update = (next) => {
    pathRef.current = next;
    setPath(next);
    props.current.onChange(next.map((i) => props.current.grid[i]).join(''));
  };

  // Circular hit area, smaller than the tile, so diagonal swipes
  // don't accidentally catch the neighbouring tiles.
  const hit = (x, y) => {
    const c = cellRef.current;
    const col = Math.floor(x / c);
    const row = Math.floor(y / c);
    if (col < 0 || row < 0 || col >= SIZE || row >= SIZE) return -1;
    const cx = (col + 0.5) * c;
    const cy = (row + 0.5) * c;
    if (Math.hypot(x - cx, y - cy) > c * 0.38) return -1;
    return row * SIZE + col;
  };

  const extend = (idx) => {
    if (idx < 0) return;
    const p = pathRef.current;
    const last = p[p.length - 1];
    if (last === idx) return;
    if (p.length >= 2 && p[p.length - 2] === idx) return update(p.slice(0, -1)); // swipe back to undo
    if (p.includes(idx)) return;
    if (p.length && !NEIGHBORS[last].includes(idx)) return;
    update([...p, idx]);
  };

  const finish = () => {
    const p = pathRef.current;
    if (p.length) props.current.onSubmit(p.map((i) => props.current.grid[i]).join(''));
    update([]);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !props.current.disabled,
      onMoveShouldSetPanResponder: () => !props.current.disabled,
      onPanResponderGrant: (e) => extend(hit(e.nativeEvent.locationX, e.nativeEvent.locationY)),
      onPanResponderMove: (e) => extend(hit(e.nativeEvent.locationX, e.nativeEvent.locationY)),
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    })
  ).current;

  const center = (i) => ({
    x: (i % SIZE) * cell + cell / 2,
    y: Math.floor(i / SIZE) * cell + cell / 2,
  });

  const segments = [];
  for (let k = 1; k < path.length; k++) {
    const a = center(path[k - 1]);
    const b = center(path[k]);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segments.push({
      key: k,
      left: (a.x + b.x) / 2 - len / 2,
      top: (a.y + b.y) / 2 - 5,
      width: len,
      angle: Math.atan2(b.y - a.y, b.x - a.x),
    });
  }

  return (
    <View style={[styles.board, { width: size, height: size }]} {...pan.panHandlers}>
      {segments.map((s) => (
        <View
          key={s.key}
          pointerEvents="none"
          style={[
            styles.segment,
            { left: s.left, top: s.top, width: s.width, transform: [{ rotate: `${s.angle}rad` }] },
          ]}
        />
      ))}
      {Array.from({ length: N }, (_, i) => {
        const active = path.includes(i);
        return (
          <View
            key={i}
            pointerEvents="none"
            style={[
              styles.tile,
              {
                left: (i % SIZE) * cell + 5,
                top: Math.floor(i / SIZE) * cell + 5,
                width: cell - 10,
                height: cell - 10,
              },
              active && styles.tileActive,
            ]}
          >
            <Text style={styles.letter}>{grid[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { backgroundColor: colors.panel, borderRadius: 24, alignSelf: 'center' },
  tile: {
    position: 'absolute',
    borderRadius: 16,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileActive: { backgroundColor: colors.active },
  letter: { fontSize: 30, fontWeight: '800', color: colors.tileText },
  segment: { position: 'absolute', height: 10, borderRadius: 5, backgroundColor: colors.line, opacity: 0.85 },
});
