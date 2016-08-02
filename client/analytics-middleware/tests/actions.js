jest.disableAutomock();

import flowRight from 'lodash/flowRight';

import { ANALYTICS_MULTI_TRACK, ANALYTICS_STAT_BUMP } from 'reducers/action-types';
import {
	composeAnalytics,
	withAnalytics,
	bumpStat
} from 'actions/analytics';

describe( 'middleware', () => {
	describe( 'actions', () => {
		it( 'should wrap an existing action', () => {
			const testAction = { type: 'RETICULATE_SPLINES' };
			const statBump = bumpStat( 'splines', 'reticulated_count' );
			const expected = {
				type: 'RETICULATE_SPLINES',
				meta: {
					analytics: [ {
						type: ANALYTICS_STAT_BUMP,
						payload: {
							group: 'splines',
							name: 'reticulated_count'
						}
					} ]
				}
			};

			const composite = withAnalytics( statBump, testAction )();

			expect( composite ).toEqual( expected );
		} );

		it( 'should trigger analytics and run passed thunks', () => {
			const dispatch = jest.fn();
			const testAction = dispatcher => dispatcher( { type: 'test' } );
			const testActionCreator = () => testAction;
			const statBump = bumpStat( 'splines', 'reticulated_count' );

			const wrappedActionCreator = withAnalytics( statBump, testActionCreator )();
			wrappedActionCreator( dispatch );

			expect( dispatch.mock.calls.length ).toBe( 2 );
		} );

		it( 'should compose multiple analytics calls', () => {
			const composite = composeAnalytics(
				bumpStat( 'spline_types', 'ocean' ),
				bumpStat( 'spline_types', 'river' )
			);

			expect( composite.type ).toBe( ANALYTICS_MULTI_TRACK );
			expect( composite.meta.analytics.length ).toBe( 2 );
		} );

		it( 'should compose multiple analytics calls without other actions', () => {
			const composite = composeAnalytics(
				bumpStat( 'spline_types', 'ocean' ),
				bumpStat( 'spline_types', 'river' )
			);
			const testAction = { type: 'RETICULATE_SPLINES' };
			const actual = withAnalytics( composite, testAction )();

			expect( actual.type ).toBe( testAction.type );
			expect( actual.meta.analytics.length ).toBe( 2 );
		} );

		it( 'should compose multiple analytics calls with normal actions', () => {
			const composite = flowRight(
				withAnalytics( bumpStat( 'spline_types', 'ocean' ) ),
				withAnalytics( bumpStat( 'spline_types', 'river' ) ),
				() => ( { type: 'RETICULATE_SPLINES' } )
			)();

			const result = composite();
			expect( result.meta.analytics.length ).toBe( 2 );
		} );

		it( 'should not swallow returned value from dispatched action', () => {
			const myResult = 'hello, yes, this is dog';
			const payloadAction = { type: 'SOME_UNRELATED_ACTION' };

			const myActionCreator = () => dispatch => {
				dispatch( payloadAction );
				return myResult;
			};

			const wrappedActionCreator = withAnalytics( bumpStat( 'splines', 'reticulated_count' ), myActionCreator );

			const dispatch = jest.fn();

			const result = wrappedActionCreator()( dispatch );
			expect( dispatch ).lastCalledWith( payloadAction );
			expect( result ).toBe( myResult );
		} );

		it( 'should call action creator with proper parameters', () => {
			const fakeDispatch = jest.fn( data => data );
			const someActionCreator = jest.fn( value => ( {
				type: 'SOME_ACTION',
				value
			} ) );

			const fakeBindActionCreators = ( actionCreator, dispatch ) =>
				( ...args ) => dispatch( actionCreator( ...args ) );

			const composite = fakeBindActionCreators( withAnalytics( someActionCreator, bumpStat( 'spline_types', 'ocean' ) ), fakeDispatch );

			composite( 123 );
			expect( someActionCreator ).toBeCalledWith( 123 );
		} );
	} );
} );
