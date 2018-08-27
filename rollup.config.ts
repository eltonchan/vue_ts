
import typescript from 'rollup-plugin-typescript2';
import sourceMaps from 'rollup-plugin-sourcemaps';

export default {
    input: 'src/index.ts',
    output: {
        file: 'dist/bundle.js',
        format: 'umd',
        name: 'myBundle',
        sourcemap: true
    },
    plugins: [
        typescript({ useTsconfigDeclarationDir: true }),
        sourceMaps()
    ]
};