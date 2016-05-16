// The tested module:
jest.unmock( '..' );

// Breaks jest for some reason:
// jest.unmock( 'wpcom' ); - replaced by a manual mock
jest.unmock( 'debug' );

jest.unmock( 'i18n-calypso' );

import i18n from 'i18n-calypso';
import middleware from '..';
import { WPCOM_REQUEST } from 'reducers/action-types.js';
import WPCOM from 'wpcom';

describe( 'wpcom-middleware', () => {
	describe( 'unrelated action', () => {
		it( 'should call next middleware', () => {
			const store = {
				getState: jest.genMockFunction().mockReturnValue( {} )
			};

			const next = jasmine.createSpy( 'next' );
			middleware( store )( next )( { type: 'TEST_ACTION' } );

			expect( next.calls.count() ).toEqual( 1 );
		} );

		it( 'should not call action creators', () => {
			const store = {
				getState: jest.genMockFunction().mockReturnValue( {} )
			};

			const actionCreator = jasmine.createSpy( 'actionCreator' );
			middleware( store )( () => {} )( {
				type: 'TEST_ACTION',
				loading: actionCreator,
				success: actionCreator,
				fail: actionCreator
			} );

			expect( actionCreator.calls.count() ).toEqual( 0 );
		} );
	} );

	describe( 'wpcom request action', () => {
		const method = 'post';
		const params = { path: '/users/email' };
		const payload = { email: 'hello@somedomain.com' };
		const LOADING_ACTION = 'LOADING_ACTION';
		const SUCCESS_ACTION = 'SUCCESS_ACTION';
		const FAIL_ACTION = 'FAIL_ACTION';

		it( 'should make proper api request with the default locale', () => {
			const store = {
				getState: jest.genMockFunction().mockReturnValue( {} ),
				dispatch: jest.genMockFunction()
			};

			middleware( store )( () => {} )( {
				type: WPCOM_REQUEST,
				method,
				params,
				payload,
				loading: LOADING_ACTION,
				success: SUCCESS_ACTION,
				fail: FAIL_ACTION
			} );

			expect( WPCOM().req[ method ] ).lastCalledWith( params, { locale: 'en' }, payload );
		} );

		it( 'should make a request with the locale when it changes in the `i18n` module', () => {
			i18n.setLocale( {
				'': { localeSlug: 'fr' }
			} );

			const store = {
				getState: jest.genMockFunction().mockReturnValue( {} ),
				dispatch: jest.genMockFunction()
			};

			middleware( store )( () => {} )( {
				type: WPCOM_REQUEST,
				method,
				params,
				payload,
				loading: LOADING_ACTION,
				success: SUCCESS_ACTION,
				fail: FAIL_ACTION
			} );

			expect( WPCOM().req[ method ] ).lastCalledWith( params, { locale: 'fr' }, payload );
		} );

		it( 'should make a request with the locale of the user if present', () => {
			const store = {
				getState: jest.genMockFunction().mockReturnValue( {
					user: {
						isLoggedIn: true,
						data: {
							locale: 'pt-br',
							bearerToken: 'foobar'
						}
					}
				} ),
				dispatch: jest.genMockFunction()
			};

			middleware( store )( () => {} )( {
				type: WPCOM_REQUEST,
				method,
				params,
				payload,
				loading: LOADING_ACTION,
				success: SUCCESS_ACTION,
				fail: FAIL_ACTION
			} );

			expect( WPCOM().req[ method ] ).lastCalledWith( params, { locale: 'pt-br' }, payload );
		} );

		pit( 'should dispatch success action', () => {
			const store = {
				getState: jest.genMockFunction().mockReturnValue( {} ),
				dispatch: jest.genMockFunction()
			};

			const promise = middleware( store )( () => {} )( {
				type: WPCOM_REQUEST,
				method,
				params,
				payload,
				loading: LOADING_ACTION,
				success: SUCCESS_ACTION,
				fail: FAIL_ACTION
			} );

			expect( WPCOM().req[ method ] ).toBeCalled();
			expect( store.dispatch ).lastCalledWith( { type: LOADING_ACTION } );

			return promise.then( () => expect( store.dispatch ).lastCalledWith( { type: SUCCESS_ACTION } ) );
		} );

		pit( 'should dispatch fail action', () => {
			const store = {
				getState: jest.genMockFunction().mockReturnValue( {} ),
				dispatch: jest.genMockFunction()
			};

			const promise = middleware( store )( () => {} )( {
				type: WPCOM_REQUEST,
				method: 'put', // hardcoded to fail in the mock
				params,
				payload,
				loading: LOADING_ACTION,
				success: SUCCESS_ACTION,
				fail: FAIL_ACTION
			} );

			expect( WPCOM().req[ method ] ).toBeCalled();
			expect( store.dispatch ).lastCalledWith( { type: LOADING_ACTION } );

			return promise.then( () => expect( store.dispatch ).lastCalledWith( { type: FAIL_ACTION } ) );
		} );

		pit( 'should propagate result of inner action dispatch on success', () => {
			const dummyAction = { type: 'DUMMY' };
			const dummyActionResult = { result: 'Hurray!' };
			const store = {
				getState: jest.genMockFunction().mockReturnValue( {} ),
				dispatch: jest.genMockFunction().mockImplementation( action => {
					if ( action && action.type === dummyAction.type ) {
						return Promise.resolve( dummyActionResult );
					}
				} )
			};

			const promise = middleware( store )( () => {} )( {
				type: WPCOM_REQUEST,
				method: 'get',
				params,
				payload,
				loading: LOADING_ACTION,
				success: () => dummyAction,
				fail: FAIL_ACTION
			} );

			return promise.then( res => expect( res ).toEqual( dummyActionResult ) );
		} );

		pit( 'should propagate result of inner action dispatch on failure', () => {
			const dummyAction = { type: 'DUMMY' };
			const dummyActionResult = { result: 'Hurray!' };
			const store = {
				getState: jest.genMockFunction().mockReturnValue( {} ),
				dispatch: jest.genMockFunction().mockImplementation( action => {
					if ( action && action.type === dummyAction.type ) {
						return Promise.resolve( dummyActionResult );
					}
				} )
			};

			const promise = middleware( store )( () => {} )( {
				type: WPCOM_REQUEST,
				method: 'put', // hardcoded to fail in the mock
				params,
				payload,
				loading: LOADING_ACTION,
				success: SUCCESS_ACTION,
				fail: () => dummyAction
			} );

			return promise.then( res => expect( res ).toEqual( dummyActionResult ) );
		} );

		pit( 'should propagate whatever success action creator returns', () => {
			const dummyValue = 42;

			const store = {
				getState: jest.genMockFunction().mockReturnValue( {} ),
				dispatch: jest.genMockFunction().mockImplementation( action => action )
			};

			const promise = middleware( store )( () => {} )( {
				type: WPCOM_REQUEST,
				method,
				params,
				payload,
				loading: LOADING_ACTION,
				success: () => dummyValue,
				fail: FAIL_ACTION
			} );

			return promise.then( res => expect( res ).toEqual( dummyValue ) );
		} );

		pit( 'should propagate whatever fail action creator returns', () => {
			const dummyValue = 42;

			const store = {
				getState: jest.genMockFunction().mockReturnValue( {} ),
				dispatch: jest.genMockFunction().mockImplementation( action => action )
			};

			const promise = middleware( store )( () => {} )( {
				type: WPCOM_REQUEST,
				method: 'put', // hardcoded to fail in the mock
				params,
				payload,
				loading: LOADING_ACTION,
				fail: () => dummyValue,
				success: FAIL_ACTION
			} );

			return promise.then( res => expect( res ).toEqual( dummyValue ) );
		} );

		pit( 'default action creator just passes through the success result', () => {
			const store = {
				getState: jest.genMockFunction().mockReturnValue( {} ),
				dispatch: jest.genMockFunction().mockImplementation( action => action )
			};

			const promise = middleware( store )( () => {} )( {
				type: WPCOM_REQUEST,
				method,
				params,
				payload
			} );

			expect( WPCOM().req[ method ] ).toBeCalled();
			return promise.then( res => expect( res ).toEqual( { great_success: true } ) );
		} );

		pit( 'default action creator just passes through the error object', () => {
			const store = {
				getState: jest.genMockFunction().mockReturnValue( {} ),
				dispatch: jest.genMockFunction().mockImplementation( action => action )
			};

			const promise = middleware( store )( () => {} )( {
				type: WPCOM_REQUEST,
				method: 'put', // hardcoded to fail in the mock
				params,
				payload
			} );

			expect( WPCOM().req[ method ] ).toBeCalled();
			return promise.catch( res => expect( res instanceof Error ).toBeTruthy() );
		} );
	} );
} );