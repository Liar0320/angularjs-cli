const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const concat = require('gulp-concat');

const sass = require('gulp-sass');
const autoprefixer = require('autoprefixer');
const postcss = require('gulp-postcss');
const browserSync = require('browser-sync').create();


const wireDep = require('wiredep').stream;

const gulpconfig = require('./gulpfile.config');

gulp.task('complie.js',()=>
    gulp.src('src/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(concat('main.js'))
        .pipe(sourcemaps.write(''))
        .pipe(gulp.dest(gulpconfig.baseDir))
        .pipe(browserSync.reload({stream:true}))    
);

gulp.task('complie.scss',()=>
    gulp.src('src/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error',sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemaps.write(''))
    .pipe(gulp.dest(gulpconfig.baseDir + '/css'))
    .pipe(browserSync.reload({stream:true}))    
)

gulp.task('index.html',()=>
    gulp.src('src/index.html')
    .pipe(wireDep())
    .pipe(gulp.dest(gulpconfig.baseDir))
)

// 静态服务器
gulp.task('serve',gulp.series(['complie.js','complie.scss','index.html', function() {
    browserSync.init({
        server: {
            baseDir: gulpconfig.baseDir
        }
    });
    gulp.watch("src/**/*.js", gulp.series(['complie.js']));
    gulp.watch("src/**/*.scss", gulp.series(['complie.scss']));
}]));


gulp.task('default',gulp.series(['serve']));


