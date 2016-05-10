// External dependencies
import i18n from 'lib/i18n';
import React, { PropTypes } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import ReactDOM from 'react-dom';
import withStyles from 'isomorphic-style-loader/lib/withStyles';

// Internal dependencies
import styles from './styles.scss';

const Home = React.createClass( {
	propTypes: {
		fields: PropTypes.object.isRequired
	},

	handleSubmit( { query } ) {
		if ( query && query.trim() !== '' ) {
			this.props.redirectToSearch( query );
		} else {
			ReactDOM.findDOMNode( this.refs.query ).focus();
		}
	},

	render() {
		const { fields: { query }, handleSubmit } = this.props;

		return (
			<form onSubmit={ handleSubmit( this.handleSubmit ) }>
				<h2 className={ styles.heading }>
					{ i18n.translate( 'Find your perfect site address.' ) }
				</h2>

				<input
					{ ...query }
					autoFocus
					className={ styles.field }
					placeholder={ i18n.translate( 'Type a few keywords or an address' ) }
					ref="query" />

				<ReactCSSTransitionGroup
					transitionName={ styles.emptySearchNotice }
					transitionEnterTimeout={ 500 }
					transitionLeaveTimeout={ 1 }>
					{ this.state.isEmptySearch && (
						<div className={ styles.emptySearchNotice }>
							{ i18n.translate( "Hi there! Try something like '%(randomQuery)s'.", {
								args: { randomQuery: 'travel mom foodie' }
							} ) }
						</div>
					) }
				</ReactCSSTransitionGroup>

				<button className={ styles.button }>
					{ i18n.translate( "Let's find an address" ) }
				</button>
			</form>
		);
	}
} );

export default withStyles( styles )( Home );
