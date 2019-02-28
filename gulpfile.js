const gulp = require('gulp');
const connect = require('gulp-connect');
const runSequence = require('run-sequence').use(gulp);
const processhtml = require('gulp-processhtml');
const changed = require('gulp-changed');
const del = require('del');
const path = require('path');
const please = require('gulp-pleeease');
const sass = require('gulp-sass');
const imagemin = require('gulp-imagemin');
const gulpif = require('gulp-if');
const prettify = require('gulp-prettify');
const rename = require('gulp-rename');
const babel = require('gulp-babel');
const jshint = require('gulp-jshint');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

let config = require('./config');

let paths = {
    dist: path.join(config.folders.dist),
    assets: path.join(config.folders.dist, config.folders.assets),
    html: path.join(config.folders.dist),
    js: path.join(config.folders.dist, config.folders.assets, 'js'),
    jsConcat: path.join(config.folders.dist, config.folders.assets, 'js'),
    fonts: path.join(config.folders.dist, config.folders.assets, 'fonts'),
    css: path.join(config.folders.dist, config.folders.assets, 'css'),
    img: path.join(config.folders.dist, config.folders.assets, 'img'),
};

let targets = {
    dist: {
        environment: 'dist',
        data: {
            assets: config.folders.assets,
        },
    },
    dev: {
        environment: 'dev',
        data: {
            assets: config.folders.assets,
        },
    },
};

gulp.task('plugins', function() {
    gulp.src(config.plugins.js)
        .pipe(gulp.dest(paths.js));

    gulp.src(config.plugins.jsConcat)
        .pipe(gulpif(config.compress, concat('plugins.min.js')))
        .pipe(gulpif(config.compress, uglify()))
        .pipe(gulp.dest(paths.jsConcat));

    gulp.src(config.plugins.css)
        .pipe(gulpif(config.compress, concat('plugins.min.css')))
        .pipe(gulp.dest(paths.css));

    gulp.src(config.plugins.fonts)
        .pipe(gulp.dest(paths.fonts));

    gulp.src(config.plugins.img)
        .pipe(gulp.dest(paths.img));
});

gulp.task('html', () => {
    gulp.src(['src/html/**/*.html', '!src/html/layout/**/*'])
        .pipe(changed(path.join(paths.html)))
        .pipe(processhtml({
            recursive: true,
            process: true,
            strip: true,
            environment: targets[config.environment].environment,
            data: targets[config.environment].data,
            customBlockTypes: [],
        }))
        .pipe(gulpif(config.compress, prettify({indent_size: 2})))
        .pipe(gulp.dest(path.join(paths.html)))
        .pipe(connect.reload());
});

gulp.task('html:dist', function() {
    gulp.src(['src/html/**/*.html', '!src/html/layout/**/*'])
        .pipe(processhtml({
            recursive: true,
            process: true,
            strip: true,
            environment: targets[config.environment].environment,
            data: targets[config.environment].data,
            customBlockTypes: []
        }))
        .pipe(gulpif(config.compress, prettify({indent_size: 2})))
        .pipe(gulp.dest(path.join(paths.html)))
        .pipe(connect.reload());
});

gulp.task('scss', () => {
    gulp.src('src/scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpif(config.compress, please({
        'autoprefixer': true,
        'filters': true,
        'rem': true,
        'opacity': true,
    })))
    .pipe(gulpif(config.compress, rename({
        suffix: '.min',
        extname: '.css',
    })))
    .pipe(gulp.dest(paths.css))
    .pipe(connect.reload());
});

gulp.task('js', () => {
    gulp.src(['src/js/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(babel({
            presets: ['@babel/env'],
        }))
        .pipe(gulpif(config.compress, concat('app.min.js')))
        .pipe(gulpif(config.compress, uglify()))
        .pipe(gulp.dest(paths.js))
        .pipe(connect.reload());
});

gulp.task('img', () => {
    gulp.src('src/img/**/*')
        .pipe(gulpif(config.compress, imagemin()))
        .pipe(gulp.dest(paths.img))
        .pipe(connect.reload());
});

gulp.task('fonts', () => {
    gulp.src('src/img/**/*')
        .pipe(gulp.dest(paths.fonts))
        .pipe(connect.reload());
});

gulp.task('dev', function() {
    config.environment = 'dev';

    runSequence(
        ['clean'],
        ['plugins', 'html', 'js', 'scss', 'img', 'fonts']
    );
});

gulp.task('work', function() {
    runSequence(
        ['dev'],
        ['connect', 'watch']
    );
});

gulp.task('dist', function() {
    config.compress = true;
    config.environment = 'dist';

    runSequence(
        ['clean'],
        ['plugins', 'html', 'js', 'scss', 'img', 'fonts']
    );
});

gulp.task('watch', () => {
    gulp.watch(['src/html/**/*'], ['html']);
    gulp.watch(['src/html/layout/**/*'], ['html:dist']);
    gulp.watch(['src/js/**/*'], ['js']);
    gulp.watch(['src/scss/**/*'], ['scss']);
    gulp.watch(['src/img/**/*'], ['img']);
    gulp.watch(['src/fonts/**/*'], ['fonts']);
});

gulp.task('clean', function() {
    return del.sync([
        paths.dist,
    ]);
});

gulp.task('connect', () => {
    connect.server({
        root: config.folders.dist,
        port: 8000,
        livereload: true,
    });
});

gulp.task('default', () => {
    runSequence(
        ['connect']
    );
});
