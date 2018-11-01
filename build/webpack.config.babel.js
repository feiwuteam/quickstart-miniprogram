import {
	resolve
} from 'path';
import {
	DefinePlugin,
	EnvironmentPlugin,
	IgnorePlugin,
	optimize
} from 'webpack';
import MiniProgramWebpackPlugin from 'miniprogram-webpack-plugin';
import StylelintPlugin from 'stylelint-webpack-plugin';
import MinifyPlugin from 'babel-minify-webpack-plugin';
import TSLintPlugin from 'tslint-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import SpeedMeasurePlugin from 'speed-measure-webpack-plugin';
import {
	BundleAnalyzerPlugin
} from 'webpack-bundle-analyzer'
import {
	warmup
} from 'thread-loader';
import HappyPack from 'happypack';
import pkg from '../package.json';

warmup({}, ['ts-loader', 'babel-loader', 'tslint-loader', 'eslint-loader'])

const smp = new SpeedMeasurePlugin();

const {
	NODE_ENV
} = process.env;
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

export default (env = {}) => {
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
		module: {
			rules: [{
					test: /\.js$/,
					include: /src/,
					exclude: [
						/node_modules/
					],
					loader: 'happypack/loader?id=js'
				},
				{
					test: /\.tsx$/,
					enforce: 'pre',
					exclude: [
						/node_modules/
					],
					loader: 'happypack/loader?id=ts'
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
				// {
				// 	test: /\.(wxml|html)$/,
				// 	include: /src/,
				// 	use: [
				// 		relativeFileLoader('wxml'),
				// 		{
				// 			loader: 'wxml-loader',
				// 			options: {
				// 				root: srcDir,
				// 				enforceRelativePath: true
				// 			},
				// 		},
				// 	],
				// },
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
			new MiniProgramWebpackPlugin({
				clear: !isDev,
				basePath: srcDir
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
			new HappyPack({
				id: 'ts',
				threads: 2,
				loaders: [{
						loader: 'cache-loader'
					},
					{
						path: 'ts-loader',
						query: {
							happyPackMode: true
						}
					}
				]
			}),
			new HappyPack({
				id: 'js',
				threads: 2,
				loaders: [{
						loader: 'cache-loader'
					},
					{
						loader: 'babel-loader'
					},
					{
						loader: 'eslint-loader'
					}
				]
			}),
			// new BundleAnalyzerPlugin({
			// 	analyzerHost: "0.0.0.0",
			// 	analyzerPort: "8888",
			// 	openAnalyzer: !isDev
			// })
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
