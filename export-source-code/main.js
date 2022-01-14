const db = require("./utils/db");
const path = require("path");
const fs = require("fs");
const zipper = require("zip-local");
const config = require("./config-server");
const { exit } = require("process");

const writeFileRecursive = function (targetPath, filename, buffer, callback) {
  fs.mkdir(targetPath, { recursive: true }, (err) => {
    if (err) return callback(err);

    fs.writeFile(path.join(targetPath, filename), buffer, function (err) {
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
            const targetPath = path.join(
              config.dataPath,
              cid.toString(),
              pid[item.problem_id]
            );

            const filename =
              cid.toString() +
              "-" +
              pid[item.problem_id] +
              "-" +
              status[item.result] +
              "-" +
              item.in_date +
              ".cpp";

            writeFileRecursive(
              targetPath,
              filename,
              item.source,
              function (err) {
                if (err) {
                  console.error(err);
                  exit(1);
                }

                console.log(
                  "write files successfully. [path=" +
                    path.join(targetPath, filename) +
                    "]"
                );

                cnt += 1;

                if (cnt == res.length) {
                  zipper.zip(
                    path.join(config.dataPath, cid.toString()),
                    function (error, zipped) {
                      if (!error) {
                        // compress before exporting
                        zipped.compress();

                        // get the zipped file as a Buffer
                        var buff = zipped.memory();

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
              }
            );
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
