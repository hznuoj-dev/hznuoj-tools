var config = {
  dataPath: "data",
  cids: [1, 2],
  mysql: {
    connectionLimit: 100,
    host: "",
    user: "",
    password: "",
    database: "jol",
    port: 3306,
    useConnectionPooling: true, // 使用连接池
  },
};

module.exports = config;
