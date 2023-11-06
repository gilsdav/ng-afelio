var gulp = require('gulp');
var replace = require('gulp-replace');
var rename = require("gulp-rename");
var minimist = require('minimist');

var options = minimist(process.argv.slice(2));

function upperFirst(text) {
    return text.slice(0, 1).toUpperCase() + text.slice(1, text.length);
}

function kebabToPascalCase(text) {
    return text.split('-').map(upperFirst).join('');
}

function toKebabCase(text) {
    return text &&
        text
            .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
            .map(x => x.toLowerCase())
            .join('-');
}

function addExtnameTmpl(str, dirname) {
    console.log(str+'.tmpl');
    return {in: str+'.tmpl', out: str, dirname: dirname};
}

gulp.task('replace-package', function () {
    const src = addExtnameTmpl('package.json', 'apis/api/');
    return gulp.src([src.dirname+src.in])
        .pipe(replace('${apiName}', options.apiName))
        .pipe(replace('${apiVersion}', options.apiVersion))
        .pipe(replace('${apiOwner}', options.apiOwner))
        .pipe(replace('${registry}', options.registry || ''))
        .pipe(replace('${apiKey}', options.apiKey || ''))
        .pipe(replace('${scopeName}', options.scopeName ? `@${options.scopeName}/` : ''))
        .pipe(rename(src.out))
        .pipe(gulp.dest(src.dirname));
});

gulp.task('replace-api-gen', function () {
    const apiPascalName = kebabToPascalCase(options.apiName);
    const moduleName = apiPascalName + 'Module';
    const configName = apiPascalName + 'Configuration';
    const src = addExtnameTmpl('ng-swagger-gen-api.json');
    return gulp.src([src.in])
        .pipe(replace('${apiFile}', options.apiFile))
        .pipe(replace('${apiName}', options.apiName))
        .pipe(replace('${moduleName}', moduleName))
        .pipe(replace('${configName}', configName))
        .pipe(replace('${apiVersion}', options.apiVersion) || '')
        .pipe(replace('${apiKey}', options.apiKey || ''))
        .pipe(replace('${proxy}', options.proxy || ''))
        .pipe(rename(src.out))
        .pipe(gulp.dest('./'));
});

gulp.task('replace-module-name', function () {
    const apiKebabName = toKebabCase(options.apiName);
    const moduleFileName = apiKebabName + '.module';
    const configFileName = apiKebabName + '-configuration';
    const src = addExtnameTmpl('public-api.ts', 'apis/api/src/');
    return gulp.src([src.dirname+src.in])
        .pipe(replace('${moduleFileName}', moduleFileName))
        .pipe(replace('${configFileName}', configFileName))
        .pipe(rename(src.out))
        .pipe(gulp.dest(src.dirname));
});


gulp.task('default', gulp.series('replace-package', 'replace-api-gen', 'replace-module-name'));
