const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const concat = require('gulp-concat');

const browserSync = require('browser-sync');

gulp.task('complie.js',()=>
    gulp.src('src/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(concat('main.js'))
        .pipe(sourcemaps.write(''))
        .pipe(gulp.dest('dist'))    
);

gulp.task('serve', gulp.series(['complie.js']), function() {
    browserSync.init({
        server: "./dest"
    });
    // gulp.watch("src/module/**/css/*.scss", ['css']);
    // gulp.watch("src/module/**/*.html", ['copyHtml']);
    // gulp.watch("src/module/public/**/*", ['copyJs']);
    gulp.watch("src/**/*.js", ['complie.js']);
    // gulp.watch("src/module/**/images/*.*", ['images']);
    // gulp.watch("*.html").on('change', browserSync.reload);
});

gulp.task('default',gulp.series(['serve']));