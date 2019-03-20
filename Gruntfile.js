/**
 * GRUNT
 *
 * Run `grunt watch` to develop, and this will automatically trigger
 * js/less dev buids as appropriate.
 *
 *
 */
module.exports = function(grunt) {

	// @note run `grunt watch` to have ongoing dev builds as files are modified
	grunt.registerTask('watch', ['watch']);

	/**
	 * This task builds our JS and LESS in a production configuration
	 */
	grunt.registerTask('default', [
		'concat:js', // concatinate require.js and our application js into one file
		'uglify', // uglify/min our JS
		'less',
		'clean' // CLEAN UR ROOM!
	]);

	// some handy vars maybe

	grunt.initConfig({

		cnf: {
			pub: process.cwd() + '/pub',
			src: process.cwd() + '/fe-src',
			tmp: process.cwd() + '/build-tmp',
			vendor: process.cwd() + '/node_modules',
			pkg: grunt.file.readJSON('package.json'),
			banner: "/**" +
				'\n * <%= cnf.pkg.name %>' +
				'\n * v<%= cnf.pkg.version %>' +
				'\n * <%= grunt.template.today("yyyy-mm-dd hh:MM:ss TT") %> ' +
				"\n */ \n\n"
		},

		/**
		 * Clean up some intermediary JS files created in the build process
		 */
		clean: {
			build: {
				src: [
					// "<%= cnf.tmp %>/main.build.js",
					// "<%= cnf.tmp %>/main.concat.js",
					// actually now that we have a tmp dir -- put wwhatever you want to go away
					// in there and it just goes away!  yay clean:
					"<%= cnf.tmp %>"
				]
			}
		},

		concat: {

			js: {
				options: {
					separator: '\n'
				},
				src: [
					"<%= cnf.src %>/js/vendor/jquery-3.1.1.slim.min.js",
  				"<%= cnf.src %>/js/vendor/vtt-parser.js",
  				"<%= cnf.src %>/js/vendor/modalBasic.js",
  				"<%= cnf.src %>/js/vendor/tipzy.js",
					"<%= cnf.src %>/js/app.js"
				],
				dest: "<%= cnf.pub %>/js/app.concat.js"
			},

		},

		/**
		 * Minify our JS for production builds
		 */
		uglify: {
			options: {
				mangle: true
			},
			js: {
				files: {
					'<%= cnf.pub %>/js/app.min.js' : ['<%= cnf.pub %>/js/app.concat.js']
				}
			}
		},

		less: {
			dev: {
				options: {
					cleancss: true,
          compress: true,
					banner: "<%= cnf.banner %>"
				},
				files: {
					"<%= cnf.pub %>/css/main.min.css" : "<%= cnf.src %>/less/main.less"
				}
			},
		},

		jshint: {
			options: {
				curly: false,
				eqeqeq: false,
				eqnull: false,
				browser: true,
				force: true,
				globals: {
					jQuery: true
				},
				ignore: [
					// @note flipped this -- only linting our direct src
				]
			},
			dev: [
				'<%= cnf.src %>/js/app.js',
				//'<%= cnf.src %>/js/**/*.js'
			]
		},

		watch: {
			js: {
				files: [
					'<%= cnf.src %>/**/*.js'
				],
				// watch assumes 'dev' is happening
				tasks: ['jshint:dev', 'concat:js', 'uglify:js', 'clean']
			},
			css: {
				files: [
					'<%= cnf.src %>/less/**/*.less',
				],
				tasks: ['less']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');


};
