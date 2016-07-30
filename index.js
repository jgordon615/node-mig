"use strict";

var fs = require("fs"),
        path = require("path"),
        async = require("async");

function getFileData(options, callback) {
    fs.readdir(options.migrationsFolder, null, function(err, files) {
        if (err) {
            return callback(err);
        }

        files = files.map(function(file) {
            var parts = file.split(".");
            return {
                num: parseInt(parts[0], 10),
                operation: parts[1],
                fullPath: path.join(options.migrationsFolder, file),
                description: (parts[2] || file).replace(/'/g, '')
            };
        });

        files.sort(function(a,b) { return a.num - b.num; });

        return callback(null, files);
    });
}

function getLatestVersionNumberSync(files) {
    return files[files.length-1].num;
}

function migrate(options, processor, callback) {
    if (!options) {
        return callback("Missing objects object.");
    }
    if (!options.migrationsFolder) {
        return callback("Missing migrationsFolder attribute of options object.");
    }

    options.schemaTable = options.schemaTable || "__schemaversion";

    async.series(
            [
                function(cb) { getFileData(options, cb); },
                function(cb) { processor.initializeDatabase(options, cb); },
                function(cb) { processor.getLatestVersionNumber(options, cb); }
            ],
            function(err, results) {
                if (err) {
                    return callback(err);
                }
                var files = results[0];
                var dbVersion = results[2];

                var targetVersion = options.migrateTo || getLatestVersionNumberSync(files);
                // We only support migrating forwards for now.
                if (targetVersion < dbVersion) {
                    var msg = "Unsupported operation.  Undoing versions is not yet supported.";
                    console.warn(msg);
                    return callback(msg);
                }
                if (targetVersion === dbVersion) {
                    console.log("Database is already up to date.");
                    return callback();
                }

                files = files.filter(function(file) {
                    return file.num > dbVersion && file.num <= targetVersion;
                });

                var fileRunners = files.map(function(file) {
                    return function(cb) {
                        processor.runMigration(options, file, function() {
                            processor.recordSchemaChange(file, cb);
                        });
                    }
                });

                async.series(fileRunners, callback);
            }
    );
}

module.exports = {
    migrate: migrate,
    mssql: require("./lib/db_processors/mssql")
};