#!/usr/bin/env node

// This script will return a url of the public.tar.gz file generated in our latest master build.
// eg: node bin/get-circle-string-artifact-url | xargs curl

const https = require( 'https' );
const path = '/api/v1/project/Automattic/delphin/latest/artifacts?branch=master&filter=successful&circle-token=' + process.env.CIRCLE_CI_TOKEN;

const options = {
	host: 'circleci.com',
	port: 443,
	path: path,
	headers: {
		'Accept': 'application/json'
	}
};

https.get( options, ( response ) => {
	var body = '';
	response.on( 'data', function( data ) {
		body += data;
	} );

	response.on( 'end', () => {
		const artifacts = JSON.parse( body );
		const artifact = artifacts.filter( ( artifact ) => artifact.pretty_path === '$CIRCLE_ARTIFACTS/public.tar.gz' ).shift();
		if( ! artifact ) {
			console.error( 'failed to get latest build artifact information from circle ci', artifacts );
			process.exit( 1 );
		}
		console.log( artifact.url + '?circle-token=' + process.env.CIRCLE_CI_TOKEN );
	} );

} ).on( 'error', error => {
	console.error( 'failed to get latest build artifact information from circle ci', error );
	process.exit( 1 );
} );
