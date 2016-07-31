var fs = require("fs");

function useMSSql(sql) {
    return {
        getLatestVersionNumber: function(options, cb) {
            //console.log("getLatestVersionNumber...")
            new sql.Request().query("select isnull(max(version), 0) as max_version from [" + options.schemaTable + "]").then(function (recordset) {
                cb(null, recordset[0].max_version);
            }).catch(cb);
        },
        initializeDatabase: function(options, cb) {
            //console.log("initializeDatabase...")
            new sql.Request().query(
                "if not exists ( select * from sys.tables where name = '" + options.schemaTable + "' ) " +
                "create table [" + options.schemaTable + "] ( version int, filename nvarchar(255), created datetime default(current_timestamp) );"
            ).then(cb).catch(cb);
        },
        runMigration: function(options, file, cb) {
            //console.log("runMigration...")

            console.log("Running migration", file.num, ":", file.description);

            fs.readFile(file.fullPath, function(err, contents) {
                if (err) {
                    return cb(err);
                }
                new sql.Request().batch(contents.toString()).then(cb).catch(cb);
            });


        },
        recordSchemaChange: function(options, file, cb) {
            //console.log("initializeDatabase...")
            new sql.Request().query(
                "insert into [" + options.schemaTable + "] ( version, filename ) values ( " + file.num + ", '" + file.description + "');"
            ).then(cb).catch(cb);
        }
    }
}

module.exports = useMSSql;