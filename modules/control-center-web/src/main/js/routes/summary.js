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

var db = require('../db');

var router = require('express').Router();

var generatorCommon = require('./generator/common');
var generatorXml = require('./generator/xml');
var generatorJava = require('./generator/java');
var generatorDocker = require('./generator/docker');

/* GET summary page. */
router.get('/', function (req, res) {
    res.render('configuration/summary');
});

router.post('/generator', function (req, res) {
    // Get cluster.
    db.Cluster.findById(req.body._id).deepPopulate('caches caches.queryMetadata caches.storeMetadata').exec(function (err, cluster) {
        if (err)
            return res.status(500).send(err.message);

        if (!cluster)
            return res.sendStatus(404);

        var clientCache = req.body.clientNearConfiguration;

        if (clientCache)
            return res.send({
                xmlClient: generatorXml.generateClusterConfiguration(cluster, clientCache),
                javaClient: generatorJava.generateClusterConfiguration(cluster, req.body.javaClass, clientCache)
            });

        return res.send({
            xmlServer: generatorXml.generateClusterConfiguration(cluster),
            javaSnippetServer: generatorJava.generateClusterConfiguration(cluster, false),
            javaClassServer: generatorJava.generateClusterConfiguration(cluster, true),
            docker: generatorDocker.generateClusterConfiguration(cluster, '%OS%')
        });
    });
});

router.post('/download', function (req, res) {
    // Get cluster with all inner objects (caches, metadata).
    db.Cluster.findById(req.body._id).deepPopulate('caches caches.queryMetadata caches.storeMetadata').exec(function (err, cluster) {
        if (err)
            return res.status(500).send(err.message);

        if (!cluster)
            return res.sendStatus(404);

        var clientNearConfiguration = req.body.clientNearConfiguration;

        var archiver = require('archiver');

        // Creating archive.
        var zip = archiver('zip');

        zip.on('error', function (err) {
            res.status(500).send({error: err.message});
        });

        // On stream closed we can end the request.
        res.on('close', function () {
            return res.status(200).send('OK').end();
        });

        // Set the archive name.
        res.attachment(cluster.name + (clientNearConfiguration ? '-client' : '-server') + '-configuration.zip');

        // Send the file to the page output.
        zip.pipe(res);

        if (!clientNearConfiguration) {
            zip.append(generatorDocker.generateClusterConfiguration(cluster, req.body.os), {name: "Dockerfile"});

            var props = generatorCommon.generateProperties(cluster);

            if (props)
                zip.append(props, {name: "secret.properties"});
        }

        zip.append(generatorXml.generateClusterConfiguration(cluster, clientNearConfiguration), {name: cluster.name + ".xml"})
            .append(generatorJava.generateClusterConfiguration(cluster, false, clientNearConfiguration),
                {name: cluster.name + '.snippet.java'})
            .append(generatorJava.generateClusterConfiguration(cluster, true, clientNearConfiguration),
                {name: 'ConfigurationFactory.java'})
            .finalize();
    });
});

module.exports = router;
