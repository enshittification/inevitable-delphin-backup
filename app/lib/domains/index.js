// External dependencies
import i18n from 'i18n-calypso';
import parseDomain from 'parse-domain';

// Internal dependencies
import config from 'config';

const domainEndsInAvailableTldRegEx = new RegExp( '\\.(?:' + config( 'available_tlds' ).join( '|' ) + ')$', 'i' );

/**
 * Check if a string is a valid domain.
 * It does not handle all cases such as 1-letter domains
 *
 * @param {string} value - the string to test
 * @returns {boolean}    - the result of the test
 */
export function isDomain( value ) {
	// handle special cases first such as '.hello.com' which is parsed to
	// { tld: 'com', domain: 'hello', subdomain: '' } by the parse-domain lib
	if ( typeof value !== 'string' || value.charAt( 0 ) === '.' ) {
		return false;
	}

	const parsedDomain = parseDomain( value );

	// A domain is valid if it can be parsed by the lib and it has a domain, a tld but no subdomain
	return !! parsedDomain &&
		parsedDomain.tld &&
		isValidSecondLevelDomain( parsedDomain.domain ) &&
		! parsedDomain.subdomain;
}

/**
 * Check if a string is a valid second level domain.
 *
 * @param {string} value - the string to test
 * @returns {boolean}    - the result of the test
 */
export function isValidSecondLevelDomain( value ) {
	return !! value && /^[a-zA-Z0-9][a-zA-Z0-9-]{0,251}[a-zA-Z0-9]$/i.test( value );
}

/**
 * Extract the second level domain from a valid domain
 *
 * @param {string} validDomain - a valid domain to extract the sld from
 * @returns {boolean}          - the sld
 */
export function secondLevelDomainOf( validDomain ) {
	const parsedDomain = parseDomain( validDomain );
	return parsedDomain && parsedDomain.domain || '';
}

/**
 * Test if a search query can match an exact domain
 *
 * @param {string} value - the string to test
 * @returns {boolean}    - the result of the test
 */
export function isDomainSearch( value ) {
	return isDomain( value ) && domainEndsInAvailableTldRegEx.test( value );
}

/**
 * Returns a boolean representing whether the results contain a match for the query.
 *
 * @param {array} results - An array of domain suggestions
 * @param {string} query - A search query
 * @returns {boolean} - Whether there is a match for the given query.
 */
export const queryIsInResults = ( results, query ) => (
	results.some( result => result.domain_name === query || secondLevelDomainOf( result.domain_name ) === query )
);

/**
 * Strips all characters after the last period
 *
 * @param {string} string - the string to update
 * @return {string} - the updated string
 */
export const omitTld = ( string = '' ) => string.replace( /\.(.*)/g, '' );

/**
 * Adds the tld to a domain if it's not already there (or replaces it if it's not the given tld)
 *
 * @param {string} domain - the domain string to fix
 * @param {string} tld - the tld that will be used
 * @return {string} - the updated domain with the tld
 */
export const withTld = ( domain = '', tld = config( 'default_tld' ) ) => domain.replace( /^([a-z0-9\-]+)(\.\w+)?$/g, '$1.' + tld );

/**
 * Returns validation messages for the given domain.
 *
 * @param {string} query - Query to validate.
 * @return {object} - Object that may contain validation messages.
 */
export const validateDomain = query => {
	query = query.trim();
	query = query.replace( /\.blog$/gi, '' );

	if ( query === '' ) {
		return { query: i18n.translate( 'Please enter a domain name' ) };
	}

	if ( query.length < 4 ) {
		return { query: i18n.translate( 'Choose a longer domain, at least four characters.' ) };
	}

	if ( query.length > 63 ) {
		return { query: i18n.translate( 'Choose a shorter domain, up to 63 characters (not including the ".blog" part)' ) };
	}

	if ( query.charAt( 0 ) === '-' ) {
		return { query: i18n.translate( 'Don’t use a "-" (hyphen) as the first character in your domain.' ) };
	}

	if ( query.charAt( query.length - 1 ) === '-' ) {
		return { query: i18n.translate( 'Don’t use a "-" (hyphen) as the last character in your domain.' ) };
	}

	if ( query.indexOf( '.' ) > -1 ) {
		return { query: i18n.translate( 'Don’t use a "." (period) in your domain.' ) };
	}

	if ( ! isDomain( query + '.blog' ) ) {
		return { query: i18n.translate( 'Use only lowercase letters, numbers, and hyphens (a to z, 0 to 9, and -). Spaces or other characters are not supported.' ) };
	}

	return {};
};
