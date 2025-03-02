'use strict';
var fabricClientClass = require('fabric-client');
var FabricCAClient = require('fabric-ca-client');
var path = require('path');

var fabric_client = new fabricClientClass();
var configFilePath = path.join(__dirname, './ConnectionProfileChicago.yml');
fabric_client.loadFromConfig(configFilePath);

var path = require('path');
var os = require('os');

var fabric_ca_client = null;
var admin_user = null;
var member_user = null;
var store_path = path.join(os.homedir(), './hfc-key-store/chicago');
console.log(' Store path:'+store_path);

fabric_client.initCredentialStores().then(() => {
    fabric_ca_client = fabric_client.getCertificateAuthority();
    return fabric_client.getUserContext('admin', true);
  }).then((user_from_store) => {
    if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Successfully loaded admin from persistence');
        admin_user = user_from_store;
    } else {
        throw new Error('Failed to get admin.... run registerChicagoAdmin.js');
    }
    return fabric_ca_client.register({enrollmentID: 'user1', affiliation: ''}, admin_user);
}).then((secret) => {
    console.log('Successfully registered user1 - secret:'+ secret);

    return fabric_ca_client.enroll({enrollmentID: 'user1', enrollmentSecret: secret});
}).then((enrollment) => {
  console.log('Successfully enrolled member user "user1" ');
  return fabric_client.createUser(
     {username: 'user1',
     mspid: 'chicagoMSP',
     cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
     });
}).then((user) => {
     member_user = user;

     return fabric_client.setUserContext(member_user);
}).then(()=>{
     console.log('Client User1 was successfully registered and enrolled and is ready to intreact with the fabric network');

}).catch((err) => {
    console.error('Failed to register: ' + err);
	if(err.toString().indexOf('Authorization') > -1) {
		console.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
		'Try again after deleting the contents of the store directory '+store_path);
	}
});