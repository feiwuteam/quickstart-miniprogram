import { resolve } from 'path';
import {
	DefinePlugin,
	EnvironmentPlugin,
	IgnorePlugin,
	optimize
} from 'webpack';
import WXAppWebpackPlugin, { Targets } from 'wxapp-webpack-plugin';
import StylelintPlugin from 'stylelint-webpack-plugin';
import MinifyPlugin from 'babel-minify-webpack-plugin';
import TSLintPlugin from 'tslint-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import SpeedMeasurePlugin from 'speed-measure-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import { warmup } from 'thread-loader';
import pkg from '../package.json';

warmup({}, ['ts-loader', 'babel-loader', 'tslint-loader', 'eslint-loader'])

const smp = new SpeedMeasurePlugin();

const { NODE_ENV } = process.env;
const isDev = NODE_ENV !== 'production';
const srcDir = resolve('src');

const copyPatterns = [].concat(pkg.copyWebpack || []).map(
	(pattern) =>
		typeof pattern === 'string' ? {
			from: pattern,
			to: pattern
		} : pattern,
);

const relativeFileLoader = (ext = '[ext]') => {
	return {
		loader: 'file-loader',
		options: {
			useRelativePath: true,
			name: `[name].${ext}`,
			context: srcDir,
		},
	};
};

const speedLoader = () => {
	return [
		isDev && {
			loader: 'cache-loader'
		},
		isDev && {
			loader: 'thread-loader',
			options: {
				workers: require('os').cpus().length - 1
			},
		},
	]
}

export default (env = {}) => {
	const target = 'Wechat';
	return smp.wrap({
		context: resolve(__dirname, '..'),
		entry: {
			app: ['./src/app.ts']
		},
		output: {
			filename: '[name].js',
			publicPath: '/',
			path: resolve('dist'),
		},
		target: Targets[target],
		module: {
			rules: [{
				test: /\.js$/,
				include: /src/,
				exclude: [
					/node_modules/
				],
				use: [
					...speedLoader(),
					{
						loader: 'babel-loader'
					},
					{
						loader: 'eslint-loader'
					}
				].filter(v => v && typeof v !== 'boolean'),
			},
			{
				test: /\.tsx$/,
				enforce: 'pre',
				exclude: [
					/node_modules/
				],
				use: [
					...speedLoader(),
					{
						loader: 'tslint-loader',
						options: {
							fix: true,
							typeCheck: true
						}
					}].filter(v => v && typeof v !== 'boolean')
			},
			{
				test: /\.tsx?$/,
				include: /src/,
				exclude: /node_modules/,
				use: [
					...speedLoader(),
					{
						loader: 'ts-loader',
						options: {
							happyPackMode: NODE_ENV !== 'production'
						}
					}
				].filter(v => v && typeof v !== 'boolean')
			},
			{
				test: /\.(scss|wxss)$/,
				include: /src/,
				use: [
					relativeFileLoader('wxss'),
					{
						loader: 'postcss-loader'
					},
					{
						loader: 'sass-loader'
					},
				],
			},
			{
				test: /\.(json|png|jpg|gif|wxs)$/,
				include: /src/,
				use: relativeFileLoader()
			},
			{
				test: /\.(wxml|html)$/,
				include: /src/,
				use: [
					relativeFileLoader('wxml'),
					{
						loader: 'wxml-loader',
						options: {
							root: srcDir,
							enforceRelativePath: true
						},
					},
				],
			},
			],
		},
		plugins: [
			new EnvironmentPlugin({
				NODE_ENV: 'development',
			}),
			new FriendlyErrorsWebpackPlugin(),
			new DefinePlugin({
				__DEV__: isDev,
				__ENV__: require(`../config/${Object.keys(env)[0] || 'dev'}.env`)
			}),
			new WXAppWebpackPlugin({
				clear: !isDev,
				extensions: ['.ts', '.js']
			}),
			new optimize.ModuleConcatenationPlugin(),
			new IgnorePlugin(/vertx/),
			new StylelintPlugin(),
			!isDev && new MinifyPlugin(),
			new CopyPlugin(copyPatterns, {
				context: srcDir
			}),
			new TSLintPlugin({
				files: [resolve(__dirname, '..', 'src/**/*.ts')]
			}),
			new ForkTsCheckerWebpackPlugin({
				tslint: true,
				async: false,
				checkSyntacticErrors: true,
				watch: [srcDir]
			}),
			new BundleAnalyzerPlugin({
				analyzerHost: "0.0.0.0",
				analyzerPort: "8888",
				openAnalyzer: !isDev
			})
		].filter(Boolean),
		devtool: isDev && 'source-map',
		resolve: {
			modules: [resolve(__dirname, '..'), 'node_modules'],
			extensions: ['.ts', '.js'],
			alias: {
				'@': resolve(__dirname, '../src'),
				'@style': resolve(__dirname, '../src', 'styles/index.scss')
			}
		},
		watchOptions: {
			ignored: /dist|manifest/,
			aggregateTimeout: 300,
		},
	});
};
