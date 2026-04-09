const webpack = require('webpack');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = (env, argv) => ({
    entry: {
		main: './sourcejs/entrypoint.js'
    },
    output: {
        filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'outdir')
    },
	optimization: {
        minimize: argv.mode === 'production',
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true,
                        drop_debugger: true
                    },
                    mangle: true,
                    format: {
                        comments: false
                    }
                }
            })
        ]
    },
	plugins: [
		argv.mode === 'production' && new JavaScriptObfuscator({
			compact: true,
			renameGlobals: true,
			controlFlowFlattening: true,
			controlFlowFlatteningThreshold: 1.0,
			deadCodeInjection: true,
			deadCodeInjectionThreshold: 0.8,
			stringArray: true,
			stringArrayIndexShift: true,
			stringArrayThreshold: 0.9,
			stringArrayEncoding: ['rc4', 'base64'],
			transformObjectKeys: true,
			rotateStringArray: true,
			disableConsoleOutput: true,
			selfDefending: true,
			splitStrings: true,
			splitStringsChunkLength: 5,
			debugProtection: true
		}, ['vendor/*.js', 'third-party/**'])
	].filter(Boolean),
    watchOptions: {
        ignored: /node_modules/
    },
    mode: argv.mode || "development"
});