import { backConfig } from "../config.back";

export const getSqliteDbPath = (dataFolderPath:string) => {
    // return `${dataFolderPath}/.tiro/searchCache.db`
}

export const testSqlite = () => {
    // var sqlite3 = require('sqlite3').verbose();
    // const dbPath = getSqliteDbPath(backConfig.dataFolder)
    // console.log(`[SQLITE] starting test w path : ${dbPath}`);
    
    // var db = new sqlite3.Database(dbPath, (err) => {
    //     if (err) {
    //         console.error(err.message);
    //     }
    //     console.log('Connected to the2 database.');
    // });

    // db.serialize(function() {
    //    db.run("CREATE TABLE IF NOT EXISTS lorem (info TEXT)");
    
    //   var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
    //   for (var i = 0; i < 10; i++) {
    //         stmt.run("Ipsum " + i);
    //     }
    //     stmt.finalize();
        
    //     db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
    //         console.log(row.id + ": " + row.info);
    //     });
    // });
    
    // db.close();
}