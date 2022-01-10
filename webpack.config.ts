import CopyWebpackPlugin from "copy-webpack-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import HtmlWebPackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import webpack from "webpack";

const config: webpack.Configuration = {
	devtool: false,
	context: path.resolve(__dirname, "./src/dapp"),
	entry: "./index.tsx",
	output: { clean: true, filename: "[name].[chunkhash].js", path: path.resolve(__dirname, "./dist") },
	module: {
		rules: [
			{ test: /\.(js|jsx)$/, use: ["babel-loader"] },
			{ test: /\.(ts|tsx)$/, use: ["babel-loader", "ts-loader"] },
			{ test: /\.css$/i, use: [MiniCssExtractPlugin.loader, "css-loader"] },
			{ test: /\.less$/i, use: [MiniCssExtractPlugin.loader, "css-loader", "less-loader"] },
			{ test: /\.html$/i, use: ["html-loader"] },
			{ test: /\.png|ttf|woff|woff2|svg|eot$/i, use: ["file-loader"] },
		],
	},
	optimization: {
		splitChunks: { chunks: "all", usedExports: true, name: "chunk", maxSize: 1024 * 1024 },
		minimizer: [new TerserPlugin({ parallel: false, extractComments: false }), new CssMinimizerPlugin({ parallel: true })],
	},
	resolve: {
		extensions: [".html", ".css", ".js", ".ts", ".tsx", ".png"],
		// @ts-ignore
		fallback: {
			crypto: require.resolve("crypto-browserify"),
			buffer: require.resolve("buffer/"),
			stream: require.resolve("stream-browserify"),
			url: require.resolve("url/"),
		},
	},
	plugins: [
		new MiniCssExtractPlugin({ filename: "main.[hash].css" }),
		new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }),
		new webpack.DefinePlugin({ "process.env": {} }),

		new CopyWebpackPlugin({ patterns: [{ from: "./config", to: "public" }] }),

		new HtmlWebPackPlugin({
			cache: true,
			filename: "./index.html",
			favicon: "./assets/favicon.png",
			inject: "body",
			minify: false,
			scriptLoading: "blocking",
			template: "./index.html",
		}),
	],
	watchOptions: {
		ignored: ["./dist/**/*", "./node_modules/**"],
		aggregateTimeout: 3000,
	},
	// @ts-ignore
	devServer: { historyApiFallback: true },
};

export default config;
