// External dependencies
import camelCase from 'lodash/camelCase';
import first from 'lodash/first';

// Internal dependencies
import { addNotice } from 'actions/notices';
import {
	CONTACT_INFORMATION_FETCH,
	CONTACT_INFORMATION_FETCH_COMPLETE,
	CONTACT_INFORMATION_FETCH_FAILED,
	WPCOM_REQUEST
} from 'reducers/action-types';
import { snakeifyKeys } from 'lib/formatters';
import { normalizeContactInformation } from 'lib/checkout';

export const fetchContactInformation = () => ( {
	type: WPCOM_REQUEST,
	method: 'get',
	params: { path: '/me/domain-contact-information' },
	loading: { type: CONTACT_INFORMATION_FETCH },
	success: data => ( {
		type: CONTACT_INFORMATION_FETCH_COMPLETE,
		data
	} ),
	fail: error => {
		return dispatch => {
			dispatch( { type: CONTACT_INFORMATION_FETCH_FAILED, error } );
			return Promise.reject( error );
		};
	}
} );

/**
 * Validates the specified contact information.
 *
 * @param {array} domainNames - list of domain names to validate the contact information against
 * @param {object} contactInformation - user's contact information
 * @returns {object} - the corresponding action object
 */
export function validateContactInformation( domainNames, contactInformation ) {
	return {
		type: WPCOM_REQUEST,
		method: 'post',
		params: { path: '/me/domain-contact-information/validate' },
		payload: snakeifyKeys( {
			domainNames,
			contactInformation: normalizeContactInformation( contactInformation )
		} ),
		fail: error => dispatch => {
			if ( error.message !== 'Validation error' ) {
				dispatch( addNotice( {
					message: error.message,
					status: 'error'
				} ) );
			}

			return Promise.reject( error );
		},
		// We're returning a thunk here so we'll be able to return a promise as a side effect,
		// while dispatching something else ( in that case nothing ).
		// If we just return a promise ( an object without `type` prop, and therefore not an action )
		// we'll get an error from redux it doesn't know how to handle that object as it's not an action
		success: data => () => {
			const { success, messages } = data;

			if ( ! success ) {
				const errors = Object.assign.apply(
					Object,
					Object.keys( messages )
						.map( fieldName => (
								// maybe join() is more appropriate here instead of taking only the first error
								{ [ camelCase( fieldName ) ]: first( messages[ fieldName ] ) }
							)
						)
				);

				const rejectionReason = new Error( 'Validation error' );
				rejectionReason.validationErrors = errors;

				return Promise.reject( rejectionReason );
			}

			return Promise.resolve( true );
		}
	};
}
