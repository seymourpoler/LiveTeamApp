/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>', 
    meta: {
      version: '1.0',
      banner: '/*! LiveTeamApp - v<%= meta.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '* http://www.liveteamapp.com/\n' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
        'Carlos Ble;  */'
    },
    lint: {
      files: ['grunt.js']
    },
    qunit: {
      files: ['']
    },
    concat: {
      dist: {
        src: ['main.js',
  'common.js',
  'widgets.js',
  'storage.js',
  'tasks.js',
  'interactors.js',
  'databinders.js',
  'clock.js',
  'pomodoro.js',     
  'chat.js',    
  'services.js',
  'factory.js',    
  'startup.js'],
        dest: 'liveteamapp.js'
      }
    },
    min: {
      dist: {
        src: ['<config:concat.dist.dest>'],
        dest: 'liveteamapp.min.js'
      }
    },
    uglify: {
      dist: {
	files: {'liveteamapp.minug.js': ['liveteamapp.min.js']}
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {
        jQuery: true
      }
    }
  });

  // Default task.
  grunt.registerTask('default', 'concat min');

};

