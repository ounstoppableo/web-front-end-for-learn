module.exports = {
    user: 'root',
    password: 'admin',
    host: 'localhost',
    database: 'client',
    waitForConnections: true,
    connectionLimit: 15,  //最大连接数量
    maxIdle: 15, //最大空闲数量
    idleTimeout: 5000,  //空闲回收时间
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
}