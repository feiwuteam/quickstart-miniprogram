import {
	resolve
} from 'path';
import {
	DefinePlugin,
	EnvironmentPlugin,
	IgnorePlugin,
	optimize
} from 'webpack';
import WXAppWebpackPlugin, {
	Targets
} from 'wxapp-webpack-plugin';
import StylelintPlugin from 'stylelint-webpack-plugin';
import MinifyPlugin from 'babel-minify-webpack-plugin';
import TSLintPlugin from 'tslint-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import pkg from '../package.json';
import FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

const {
	NODE_ENV,
	LINT,
	CONF = "dev"
} = process.env;
const isDev = NODE_ENV !== 'production';
const shouldLint = !!LINT && LINT !== 'false';
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

export default (env = {}) => {
	const min = env.min;
	const target = 'Wechat';
	return {
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
					use: ['babel-loader', shouldLint && 'eslint-loader'].filter(Boolean),
				},
				{
					test: /\.ts$/,
					enforce: 'pre',
					exclude: [
						/node_modules/
					],
					use: [{
						loader: 'tslint-loader',
						options: {
							fix: true,
							typeCheck: true,
							configFile: './tsconfig.json',
							configuration: './tslint.json',
						}
					}]
				},
				{
					test: /\.ts?$/,
					include: /src/,
					exclude: /node_modules/,
					use: [{
						loader: 'ts-loader',
						options: {
							transpileOnly: true,
							happyPackMode: NODE_ENV !== 'production'
						}
					}]
				},
				{
					test: /\.wxss$/,
					include: /src/,
					exclude: /node_modules/,
					use: [
						relativeFileLoader()
					],
				},
				{
					test: /\.(scss|wxss)$/,
					include: /src/,
					use: [
						relativeFileLoader('wxss'),
						{
							loader: 'autoprefixer-loader',
							options: {
								browsers: ['Android >= 2.3', 'Chrome > 20', 'iOS >= 6']
							}
						},
						{
							loader: 'sass-loader',
							options: {
								includePaths: [resolve(__dirname, 'src', 'style'), srcDir],
							},
						},
					],
				},
				{
					test: /\.(json|png|jpg|gif|wxss|wxs)$/,
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
				__ENV__: require(`../config/${CONF}.env`)
			}),
			new WXAppWebpackPlugin({
				clear: !isDev,
				extensions: ['.ts', '.js']
			}),
			new optimize.ModuleConcatenationPlugin(),
			new IgnorePlugin(/vertx/),
			shouldLint && new StylelintPlugin(),
			min && new MinifyPlugin(),
			new CopyPlugin(copyPatterns, {
				context: srcDir
			}),
			new TSLintPlugin({
				files: [resolve(__dirname, 'src/**/*.ts')]
			}),
			new ForkTsCheckerWebpackPlugin({
				tslint: true,
				async: false,
				checkSyntacticErrors: true,
				watch: ['../src']
			}),
			new TsconfigPathsPlugin({
				configFile: resolve(__dirname, '..', 'tsconfig.json')
			})
		].filter(Boolean),
		devtool: isDev ? 'source-map' : false,
		resolve: {
			modules: [resolve(__dirname, 'src'), 'node_modules'],
			extensions: ['.ts', '.js'],
			alias: {
				'@': resolve(__dirname, 'src'),
				'@components': resolve(__dirname, '../src/components'),
				'@utils': resolve(__dirname, '../src/utils'),
				'style': resolve(__dirname, '../src/styles/index.scss')
			}
		},
		watchOptions: {
			ignored: /dist|manifest/,
			aggregateTimeout: 300,
		},
	};
};
