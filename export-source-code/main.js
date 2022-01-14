const db = require("./utils/db");
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const tar = require("tar");
const fstream = require("fstream");
const zipper = require("zip-local");
const config = require("./config-server");
const { exit } = require("process");

//写入文件 遇到目录没创建就创建 遇到文件已存在就覆盖
const writeFileRecursive = function (path, buffer, callback) {
  let lastPath = path.substring(0, path.lastIndexOf("/"));
  fs.mkdir(lastPath, { recursive: true }, (err) => {
    if (err) return callback(err);
    fs.writeFile(path, buffer, function (err) {
      if (err) return callback(err);
      return callback(null);
    });
  });
};

var status = [
  "PD",
  "PR",
  "CI",
  "RJ",
  "AC",
  "PE",
  "WA",
  "TLE",
  "MLE",
  "OLE",
  "RE",
  "CE",
];

async function getSourceByCID(cid) {
  db.exec({
    sql: `
        SELECT *
        FROM contest_problem
        WHERE contest_id = ?
        `,
    params: [cid],
    success: (res) => {
      var pid = {};

      for (var i = 0; i < res.length; ++i) {
        pid[res[i].problem_id] = String.fromCharCode(
          "A".charCodeAt() + res[i].num
        );
      }

      db.exec({
        sql: `
                SELECT
                problem_id, DATE_FORMAT(in_date, '%Y-%m-%d-%H-%i-%s') AS in_date, result, source
                FROM (
                    SELECT solution_id, problem_id, in_date, result
                    FROM solution
                    WHERE contest_id = ?
                ) AS solution
                LEFT JOIN source_code
                ON solution.solution_id = source_code.solution_id
                `,
        params: [cid],
        success: async (res) => {
          let cnt = 0;

          await res.forEach(function (item) {
            var dest_file = path.join(
              config.dataPath,
              cid.toString(),
              pid[item.problem_id],
              cid.toString() +
                "-" +
                pid[item.problem_id] +
                "-" +
                status[item.result] +
                "-" +
                item.in_date +
                ".cpp"
            );

            writeFileRecursive(dest_file, item.source, function () {
              cnt += 1;
              if (cnt == res.length) {
                zipper.zip(
                  path.join(config.dataPath, cid.toString()),
                  function (error, zipped) {
                    if (!error) {
                      zipped.compress(); // compress before exporting

                      var buff = zipped.memory(); // get the zipped file as a Buffer
                      // or save the zipped file to disk
                      zipped.save(
                        path.join(
                          config.dataPath,
                          "./" + cid.toString() + ".zip"
                        ),
                        function (error) {
                          if (!error) {
                            console.log("Ziped files successfully !");
                          }
                        }
                      );
                    } else {
                      console.log(error);
                    }
                  }
                );
              }
            });
            console.log(dest_file);
          });
        },
      });
    },
  });
}

async function main() {
  const cids = config.cids;

  for (const cid of cids) {
    await getSourceByCID(cid);
  }
}

main();
