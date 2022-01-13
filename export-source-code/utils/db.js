var CONFIG = require("../config-server");
var mysql = require("mysql");
var async = require("async");

module.exports = {
  config: CONFIG.mysql,
  pool: null,
  /**
   * 创建连接池
   */
  create: function () {
    const me = this;
    // 没有pool的才创建
    if (!me.pool) {
      me.pool = mysql.createPool(me.config);
    }
  },
  /**
   * 执行sql
   * @param {Object} config 操作对象
   */
  exec: function (config) {
    const me = this;
    me.create();
    me.pool.getConnection((err, conn) => {
      if (err) {
        console.log("mysql pool getConnections err:" + err);
        throw err;
      } else {
        conn.query(config.sql, config.params, (err, result) => {
          if (config.success) {
            config.success(result);
          }
          if (config.error) {
            config.error(err);
          }
          // 释放连接到连接池
          conn.release();
        });
      }
    });
  },
  //执行事务
  execTrans: function (sqlparamsEntities, callback) {
    const me = this;
    me.create();
    me.pool.getConnection(function (err, connection) {
      if (err) {
        return callback(err, null);
      }
      connection.beginTransaction(function (err) {
        if (err) {
          return callback(err, null);
        }
        console.log(
          "开始执行transaction，共执行" + sqlparamsEntities.length + "条数据"
        );
        var funcAry = [];
        sqlparamsEntities.forEach(function (sql_param) {
          var temp = function (cb) {
            var sql = sql_param.sql;
            var param = sql_param.params;
            connection.query(sql, param, function (tErr, rows, fields) {
              if (tErr) {
                connection.rollback(function () {
                  console.log("事务失败，" + sql_param + "，ERROR：" + tErr);
                  throw tErr;
                });
              } else {
                return cb(null, "ok");
              }
            });
          };
          funcAry.push(temp);
        });

        async.series(funcAry, function (err, result) {
          console.log("transaction error: " + err);
          if (err) {
            connection.rollback(function (err) {
              console.log("transaction error: " + err);
              connection.release();
              return callback(err, null);
            });
          } else {
            connection.commit(function (err, info) {
              console.log("transaction info: " + JSON.stringify(info));
              if (err) {
                console.log("执行事务失败，" + err);
                connection.rollback(function (err) {
                  console.log("transaction error: " + err);
                  connection.release();
                  return callback(err, null);
                });
              } else {
                connection.release();
                return callback(null, info);
              }
            });
          }
        });
      });
    });
  },
  //得到sql操作参数
  _getNewSqlParamEntity: function (sql, params, callback) {
    if (callback) {
      return callback(null, {
        sql: sql,
        params: params,
      });
    }
    return {
      sql: sql,
      params: params,
    };
  },
};

// const handler = require('./mysqlHandler.js');
// handler.exec({
//     sql: 'select * from table where id = ?',
//     params: [id],
//     success: res => {
//         console.log(res);
//     },
//     error: err => {
//         console.log(err);
//     }
// });
