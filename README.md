# node-mig
DB agnostic migrations module for node.js.

Honorable mention goes to https://github.com/rickbergfalk/postgrator for inspiration for this project.
Though this is not a fork of his project, I used many of his conventions in the documentation, configuration, etc.

## Usage
Migration scripts should be named with the convention "[version].[action].[description].sql".

**version** must be numeric.

**action** must be either "do" or "undo". Undo is not yet supported.

**description** is a brief description of what the file does.  It should not contain periods nor apostrophes.

## Database
The database processor is provided to node-mig during initialization.  I have provided a sample processor for mssql, though the actual db connection is managed by you.  

Here is sample code that connects to a mssql database (using the mssql module) and migrates that database up to the latest version:

```
var sql = require("mssql");

sql.connect(myDBConfigOptions).then(function() {
    var migrator = require("node-mig");
    var processor = migrator.mssql(sql);

    migrator.migrate(
        { migrationsFolder: path.join(__dirname, "migrations") },
        processor,
        warnOnError
    );
}).catch(warnOnError);
```
