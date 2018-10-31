import { join } from 'path'
import HappyPack from 'happypack'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import SpeedMeasurePlugin from 'speed-measure-webpack-plugin';
import paths from './paths';

const { NODE_ENV } = process.env;
const isDev = NODE_ENV === 'development';
const smp = new SpeedMeasurePlugin();

const relativeFileLoader = ({
	loadername = 'file',
	ext = '[ext]',
	options = {}
} = {}) => ({
	loader: `${loadername}-loader`,
	options: {
		name: `[name].${ext}`,
		context: paths.appSrc,
		useRelativePath: true,
		...options
	},
});

export default smp.wrap({
	mode: isDev ? 'development' : 'production',
	context: paths.app,
	entry: {
		app: [
			join(paths.appSrc, 'app.js')
		]
	},
	output: {
		filename: '[name].js',
		publicPath: '/',
		path: paths.appDist,
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				include: paths.appSrc,
				exclude: paths.appNodeModules,
				loader: 'happypack/loader?id=js'
			},
			{
				test: /\.ts$/,
				include: paths.appSrc,
				exclude: paths.appNodeModules,
				loader: 'happypack/loader?id=ts'
			},
			{
				test: /\.(scss|wxss)$/,
				include: paths.appSrc,
				exclude: paths.appNodeModules,
				use: [
					relativeFileLoader({ ext: 'wxss' }),
					{
						loader: 'css-loader'
					},
					{
						loader: 'postcss-loader'
					},
					{
						loader: 'sass-loader'
					},
				],
			},
			{
				test: /\.(json|png|jpg|gif)$/,
				include: paths.appSrc,
				exclude: paths.appNodeModules,
				use: relativeFileLoader({
					loadername: 'url',
					options: { limit: 8192 }
				})
			},
			{
				test: /\.wxs$/,
				include: paths.appSrc,
				exclude: paths.appNodeModules,
				use: relativeFileLoader()
			},
			{
				test: /\.(wxml|html)$/,
				include: paths.appSrc,
				exclude: paths.appNodeModules,
				use: [
					relativeFileLoader({ ext: 'wxml' }),
					{
						loader: 'wxml-loader',
						options: {
							root: paths.appSrc,
							enforceRelativePath: true
						},
					},
				],
			},
		]
	},
	plugins: [
		new HappyPack({
			id: 'js',
			threads: 2,
			loaders: [
				{
					loader: 'babel-loader'
				},
				{
					loader: 'eslint-loader'
				}
			]
		}),
		new HappyPack({
            id: 'ts',
            threads: 2,
            loaders: [
                {
                    path: 'ts-loader',
                    query: { happyPackMode: true }
                }
            ]
		}),
		new ForkTsCheckerWebpackPlugin({
			checkSyntacticErrors: true,
			tslint: true,
			// async: false,
			// watch: [srcDir]
		}),
	],
	resolve: {
		modules: [paths.appNodeModules], // [resolve(__dirname, '..'), 'node_modules'],
		extensions: [ '.ts', '.js' ],
		alias: {
			'@': paths.appSrc,
			'@style': join(paths.appSrc, 'styles', 'index.scss')
		}
	},
});

// import { resolve } from 'path';
// import {
// 	DefinePlugin,
// 	EnvironmentPlugin,
// 	IgnorePlugin,
// 	optimize
// } from 'webpack';
// import WXAppWebpackPlugin, { Targets } from 'wxapp-webpack-plugin';
// import StylelintPlugin from 'stylelint-webpack-plugin';
// import TSLintPlugin from 'tslint-webpack-plugin';
// import CopyPlugin from 'copy-webpack-plugin';
// import FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin';
// import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
// import { warmup } from 'thread-loader';
// import pkg from '../package.json';

// warmup({}, ['ts-loader', 'babel-loader', 'tslint-loader', 'eslint-loader'])

// const copyPatterns = [].concat(pkg.copyWebpack || []).map(
// 	(pattern) =>
// 		typeof pattern === 'string' ? {
// 			from: pattern,
// 			to: pattern
// 		} : pattern,
// );

// const relativeFileLoader = (ext = '[ext]') => {
// 	return {
// 		loader: 'file-loader',
// 		options: {
// 			useRelativePath: true,
// 			name: `[name].${ext}`,
// 			context: srcDir,
// 		},
// 	};
// };

// export default (env = {}) => {
// 	const target = 'Wechat';
// 	return smp.wrap({
// 		target: Targets[target],

// 		plugins: [
// 			new EnvironmentPlugin({
// 				NODE_ENV: 'development',
// 			}),
// 			new FriendlyErrorsWebpackPlugin(),
// 			new DefinePlugin({
// 				__DEV__: isDev,
// 				__ENV__: require(`../config/${Object.keys(env)[0] || 'dev'}.env`)
// 			}),
// 			new WXAppWebpackPlugin({
// 				clear: !isDev,
// 				extensions: ['.ts', '.js']
// 			}),
// 			new optimize.ModuleConcatenationPlugin(),
// 			new IgnorePlugin(/vertx/),
// 			new StylelintPlugin(),
// 			new CopyPlugin(copyPatterns, {
// 				context: srcDir
// 			}),
// 			new TSLintPlugin({
// 				files: [resolve(__dirname, '..', 'src/**/*.ts')]
// 			}),

// 			new BundleAnalyzerPlugin({
// 				analyzerHost: "0.0.0.0",
// 				analyzerPort: "8888",
// 				openAnalyzer: !isDev
// 			})
// 		].filter(Boolean),
// 		devtool: isDev && 'source-map',
// 		watchOptions: {
// 			ignored: /dist|manifest/,
// 			aggregateTimeout: 300,
// 		},
// 	});
// };
