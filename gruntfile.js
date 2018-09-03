/*global module*/

'use strict';

module.exports = function(grunt) {

	var _ = require('underscore');
	var path = require('path');

	grunt.config('pkg', grunt.file.readJSON('package.json'));

	// grunt.config('paths.src.resources', './src/resources');
	// grunt.config('paths.src.generated', './build/generated');

	grunt.config('paths.favicons', {
		generated: 'target/generated',
		src: 'src/resources/favicons',
		dest: 'build',
	});

	/* --------------------------------
	/* Main Targets
	/* -------------------------------- */

	grunt.registerTask('build', ['build-favicons']);
	grunt.registerTask('default', ['build']);

	/* --------------------------------
	/* resources
	/* -------------------------------- */
	grunt.loadNpmTasks('grunt-contrib-copy');

	// NOTE: already loaded above
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.config('clean.favicons', {
		src: [
			'<%= paths.favicons.generated %>',
			'<%= paths.favicons.dest %>',
		]
	});
	grunt.loadNpmTasks('grunt-favicons');
	grunt.config('favicons', {
		options: {
			// debug: false,
			apple: false,
			regular: false,
			windowsTile: false,
			timestamp: true
		},
	});

	/* generate-favicons
	 * NOTE: requires `brew install imagemagick`
	 * - - - - - - - - - - - - - - - - - */
	var favTasks = ['clean:favicons'];
	var favicons = {
		black: { filename: 'profile-abstract2-black.png', color: '#000000', },
		white: { filename: 'profile-abstract2-white.png', color: '#FFFFFF', },
		prtfl: { filename: 'prtfl.png', color: '#D0021B', },
	};
	// sizes = [16, 32, 48, 64, 128, 256, 512];
	var sizes = [57, 72, 114, 120, 144, 152];

	var favObj, obj;
	for (var favName in favicons) {
		if (!favicons.hasOwnProperty(favName)) continue;

		favObj = favicons[favName];

		grunt.config('copy.svg-favicons_' + favName, {
			files: [{
				src: '<%= paths.favicons.src %>/' + favObj.filename,
				dest: '<%= paths.favicons.generated %>/' + favName + '/favicon.png',
			}]
		});

		obj = {
			templateData: [],
			globals: [{
				maskRadius: '50%',
				viewBox: '0 0 512 512',
				transform: 'translate(256, 256) scale(1.05) translate(-256, -256)'
				}],
			files: [{
				src: '<%= paths.favicons.src %>/favicon_template.hbs',
				dest: []
				}],
		};
		// NOTE: templateData.location is relative
		obj = sizes.reduce(function(acc, val, idx, arr) {
			// grunt.log.writeln('args: ' + JSON.stringify(arguments));
			acc.files[0].dest[idx] = '<%= paths.favicons.generated %>/' +
				favName + '/apple-touch-icon-' + val + 'x' + val + '.svg';
			acc.templateData[idx] = {
				location: './favicon.png',
				size: val,
			};
			return acc;
		}, obj);
		obj.files[0].dest.push('<%= paths.favicons.generated %>/' + favName + '/favicon_roundel.svg');
		obj.templateData.push({ location: './favicon.png', size: 600 });

		grunt.loadNpmTasks('grunt-compile-handlebars');
		grunt.config('compile-handlebars.svg-wrap_' + favName, obj);

		grunt.loadNpmTasks('grunt-svg2png');
		grunt.config('svg2png.favicons_' + favName, {
			files: [
				{
					cwd: '<%= paths.favicons.generated %>/' + favName + '/',
					src: ['apple-touch-icon-*.svg'],
					dest: '<%= paths.favicons.dest %>/' + favName + '/',
				}, {
					cwd: '<%= paths.favicons.generated %>/' + favName + '/',
					src: ['favicon_roundel.svg'],
					dest: '<%= paths.favicons.generated %>/' + favName + '/',
					/* this plugin seems to be using src as cwd, and swaps the file ext to png :( */
					// dest: './<%= paths.favicons.generated %>/'
				}
			]
		});
		grunt.config('favicons.square_' + favName, {
			options: {
				trueColor: false,
				tileColor: favObj.color,
				windowsTile: true,
				tileBlackWhite: false,
				apple: false,
				regular: false,
				html: '<%= paths.favicons.generated %>/favicon_square.html',
				HTMLPrefix: '/workspace/assets/images/favicons/' + favName + '/',
			},
			src: '<%= paths.favicons.generated %>/' + favName + '/favicon.png',
			dest: '<%= paths.favicons.dest %>/' + favName + '/',
		});
		grunt.config('favicons.roundel_' + favName, {
			options: {
				apple: true,
				regular: true,
				trueColor: true,
				precomposed: true,
				appleTouchBackgroundColor: favObj.color,
				appleTouchPadding: 20,
				html: '<%= paths.favicons.generated %>/' + favName + '/favicon_roundel.html',
				HTMLPrefix: '/workspace/assets/images/favicons/' + favName + '/',
			},
			src: '<%= paths.favicons.generated %>/' + favName + '/favicon_roundel.png',
			dest: '<%= paths.favicons.dest %>/' + favName + '/',

		});

		grunt.registerTask('build-favicons_' + favName, [
			// 'clean:favicons_' + favName,
			'copy:svg-favicons_' + favName,
			'compile-handlebars:svg-wrap_' + favName,
			'svg2png:favicons_' + favName,
			'favicons:square_' + favName,
			'favicons:roundel_' + favName,
		]);

		favTasks.push('build-favicons_' + favName);
	}
	grunt.registerTask('build-favicons', favTasks);

};