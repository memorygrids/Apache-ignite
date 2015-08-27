/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

if (typeof window === 'undefined') {
    $dataStructures = require('../../helpers/data-structures');
}

$generatorCommon = {};

$generatorCommon.addLeadingZero = function (numberStr, minSize) {
    if (typeof (numberStr) != 'string')
        numberStr = '' + numberStr;

    while (numberStr.length < minSize) {
        numberStr = '0' + numberStr;
    }

    return numberStr;
};

$generatorCommon.formatDate = function (date) {
    var dd = $generatorCommon.addLeadingZero(date.getDate(), 2);
    var mm = $generatorCommon.addLeadingZero(date.getMonth() + 1, 2);

    var yyyy = date.getFullYear();

    return mm + '/' + dd + '/' + yyyy + ' ' + $generatorCommon.addLeadingZero(date.getHours(), 2) + ':' + $generatorCommon.addLeadingZero(date.getMinutes(), 2);
};

$generatorCommon.mainComment = function mainComment() {
    return 'This configuration was generated by Ignite Control Center (' + $generatorCommon.formatDate(new Date()) + ')';
};

$generatorCommon.builder = function () {
    var res = [];

    res.deep = 0;

    res.lineStart = true;

    res.datasources = [];

    res.append = function (s) {
        if (this.lineStart) {
            for (var i = 0; i < this.deep; i++)
                this.push('    ');

            this.lineStart = false;
        }

        this.push(s);

        return this;
    };

    res.line = function (s) {
        if (s)
            this.append(s);

        this.push('\n');
        this.lineStart = true;

        return this;
    };

    res.startBlock = function (s) {
        if (s)
            this.append(s);

        this.push('\n');
        this.lineStart = true;
        this.deep++;

        return this;
    };

    res.endBlock = function (s) {
        this.deep--;

        if (s)
            this.append(s);

        this.push('\n');
        this.lineStart = true;

        return this;
    };

    res.emptyLineIfNeeded = function () {
        if (this.needEmptyLine) {
            this.line();

            this.needEmptyLine = false;

            return true;
        }

        return false;
    };

    res.imports = {};

    res.importClass = function (clsName) {
        var fullClassName = $dataStructures.fullClassName(clsName);

        var dotIdx = fullClassName.lastIndexOf('.');

        var shortName = dotIdx > 0 ? fullClassName.substr(dotIdx + 1) : fullClassName;

        if (this.imports[shortName]) {
            if (this.imports[shortName] != fullClassName)
                return fullClassName; // Short class names conflict. Return full name.
        }
        else
            this.imports[shortName] = fullClassName;

        return shortName;
    };

    /**
     * @returns String with "java imports" section.
     */
    res.generateImports = function () {
        var res = [];

        for (var clsName in this.imports) {
            if (this.imports.hasOwnProperty(clsName) && this.imports[clsName].lastIndexOf('java.lang.', 0) != 0)
                res.push('import ' + this.imports[clsName] + ';');
        }

        res.sort();

        return res.join('\n')
    };

    return res;
};

$generatorCommon.EVICTION_POLICIES = {
    LRU: {
        className: 'org.apache.ignite.cache.eviction.lru.LruEvictionPolicy',
        fields: {batchSize: null, maxMemorySize: null, maxSize: null}
    },
    RND: {
        className: 'org.apache.ignite.cache.eviction.random.RandomEvictionPolicy',
        fields: {maxSize: null}
    },
    FIFO: {
        className: 'org.apache.ignite.cache.eviction.fifo.FifoEvictionPolicy',
        fields: {batchSize: null, maxMemorySize: null, maxSize: null}
    },
    SORTED: {
        className: 'org.apache.ignite.cache.eviction.sorted.SortedEvictionPolicy',
        fields: {batchSize: null, maxMemorySize: null, maxSize: null}
    }
};

$generatorCommon.MARSHALLERS = {
    OptimizedMarshaller: {
        className: 'org.apache.ignite.marshaller.optimized.OptimizedMarshaller',
        fields: {poolSize: null, requireSerializable: null }
    },
    JdkMarshaller: {
        className: 'org.apache.ignite.marshaller.jdk.JdkMarshaller',
        fields: {}
    }
};

$generatorCommon.JDBC_DIALECTS = {
    Oracle: 'org.apache.ignite.cache.store.jdbc.dialect.OracleDialect',
    DB2: 'org.apache.ignite.cache.store.jdbc.dialect.DB2Dialect',
    SQLServer: 'org.apache.ignite.cache.store.jdbc.dialect.SQLServerDialect',
    MySQL: 'org.apache.ignite.cache.store.jdbc.dialect.MySQLDialect',
    PostgreSQL: 'org.apache.ignite.cache.store.jdbc.dialect.BasicJdbcDialect',
    H2: 'org.apache.ignite.cache.store.jdbc.dialect.H2Dialect'
};

$generatorCommon.jdbcDialectClassName = function(db) {
    var dialectClsName = $generatorCommon.JDBC_DIALECTS[db];

    return dialectClsName ? dialectClsName : 'Unknown database: ' + db;
};

$generatorCommon.DATA_SOURCES = {
    Oracle: 'oracle.jdbc.pool.OracleDataSource',
    DB2: 'com.ibm.db2.jcc.DB2ConnectionPoolDataSource',
    SQLServer: 'com.microsoft.sqlserver.jdbc.SQLServerDataSource',
    MySQL: 'com.mysql.jdbc.jdbc2.optional.MysqlDataSource',
    PostgreSQL: 'org.postgresql.ds.PGPoolingDataSource',
    H2: 'org.h2.jdbcx.JdbcDataSource'
};

$generatorCommon.dataSourceClassName = function(db) {
    var dsClsName = $generatorCommon.DATA_SOURCES[db];

    return dsClsName ? dsClsName : 'Unknown database: ' + db;
};

$generatorCommon.STORE_FACTORIES = {
    CacheJdbcPojoStoreFactory: {
        className: 'org.apache.ignite.cache.store.jdbc.CacheJdbcPojoStoreFactory',
        fields: {dataSourceBean: null, dialect: {type: 'jdbcDialect'}}
    },
    CacheJdbcBlobStoreFactory: {
        className: 'org.apache.ignite.cache.store.jdbc.CacheJdbcBlobStoreFactory',
        fields: {
            user: null,
            dataSourceBean: null,
            initSchema: null,
            createTableQuery: null,
            loadQuery: null,
            insertQuery: null,
            updateQuery: null,
            deleteQuery: null
        }
    },
    CacheHibernateBlobStoreFactory: {
        className: 'org.apache.ignite.cache.store.hibernate.CacheHibernateBlobStoreFactory',
        fields: {hibernateProperties: {type: 'propertiesAsList', propVarName: 'props'}}
    }
};

$generatorCommon.ATOMIC_CONFIGURATION = {
    className: 'org.apache.ignite.configuration.AtomicConfiguration',
    fields: {
        backups: null,
        cacheMode: {type: 'enum', enumClass: 'org.apache.ignite.cache.CacheMode'},
        atomicSequenceReserveSize: null
    }
};

$generatorCommon.SWAP_SPACE_SPI = {
    className: 'org.apache.ignite.spi.swapspace.file.FileSwapSpaceSpi',
    fields: {
        baseDirectory: null,
        readStripesNumber: null,
        maximumSparsity: {type: 'float'},
        maxWriteQueueSize: null,
        writeBufferSize: null
    }
};

$generatorCommon.TRANSACTION_CONFIGURATION = {
    className: 'org.apache.ignite.configuration.TransactionConfiguration',
    fields: {
        defaultTxConcurrency: {type: 'enum', enumClass: 'org.apache.ignite.transactions.TransactionConcurrency'},
        transactionIsolation: {
            type: 'org.apache.ignite.transactions.TransactionIsolation',
            setterName: 'defaultTxIsolation'
        },
        defaultTxTimeout: null,
        pessimisticTxLogLinger: null,
        pessimisticTxLogSize: null,
        txSerializableEnabled: null
    }
};

if (typeof window === 'undefined') {
    module.exports = $generatorCommon;
}
