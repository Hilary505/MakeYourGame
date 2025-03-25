import { describe, it, expect } from 'vitest';
import { TETROMINOS } from './tetrominos.js'; // Adjust the import path as needed

describe('TETROMINOS', () => {
    it('should have the correct tetromino types', () => {
        const expectedTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        expect(Object.keys(TETROMINOS)).toEqual(expectedTypes);
    });

    describe('I tetromino', () => {
        it('should have the correct shape', () => {
            const expectedShape = [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ];
            expect(TETROMINOS.I.shape).toEqual(expectedShape);
        });

        it('should have the correct color', () => {
            expect(TETROMINOS.I.color).toBe('I');
        });
    });

    describe('O tetromino', () => {
        it('should have the correct shape', () => {
            const expectedShape = [
                [1, 1],
                [1, 1]
            ];
            expect(TETROMINOS.O.shape).toEqual(expectedShape);
        });

        it('should have the correct color', () => {
            expect(TETROMINOS.O.color).toBe('O');
        });
    });

    describe('T tetromino', () => {
        it('should have the correct shape', () => {
            const expectedShape = [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ];
            expect(TETROMINOS.T.shape).toEqual(expectedShape);
        });

        it('should have the correct color', () => {
            expect(TETROMINOS.T.color).toBe('T');
        });
    });

    describe('S tetromino', () => {
        it('should have the correct shape', () => {
            const expectedShape = [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ];
            expect(TETROMINOS.S.shape).toEqual(expectedShape);
        });

        it('should have the correct color', () => {
            expect(TETROMINOS.S.color).toBe('S');
        });
    });

    describe('Z tetromino', () => {
        it('should have the correct shape', () => {
            const expectedShape = [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ];
            expect(TETROMINOS.Z.shape).toEqual(expectedShape);
        });

        it('should have the correct color', () => {
            expect(TETROMINOS.Z.color).toBe('Z');
        });
    });

    describe('J tetromino', () => {
        it('should have the correct shape', () => {
            const expectedShape = [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ];
            expect(TETROMINOS.J.shape).toEqual(expectedShape);
        });

        it('should have the correct color', () => {
            expect(TETROMINOS.J.color).toBe('J');
        });
    });

    describe('L tetromino', () => {
        it('should have the correct shape', () => {
            const expectedShape = [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ];
            expect(TETROMINOS.L.shape).toEqual(expectedShape);
        });

        it('should have the correct color', () => {
            expect(TETROMINOS.L.color).toBe('L');
        });
    });
});