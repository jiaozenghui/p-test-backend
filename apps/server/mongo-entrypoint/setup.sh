#! /bin/bash

# shell脚本中发生错误，即命令返回值不等于0，则停止执行并退出shell
set -e

mongosh <<EOF
use admin
db.auth('$MONGO_INITDB_ROOT_USERNAME', '$MONGO_INITDB_ROOT_PASSWORD')
use egg
db.createUser({
    user: '$MONGO_DB_USERNAME',
    pwd: '$MONGO_DB_PASSWORD',
    roles:[{
        role: 'readWrite',
        db: 'egg'
    }]
})
db.createCollection('tests')
db.tests.insertMany([{
    id:1,
    title: '1024程序员日'
    author: '测试人员1'
}])
EOF