// External dependencies
import { Link } from 'react-router';
import React, { PropTypes } from 'react';
import withStyles from 'isomorphic-style-loader/lib/withStyles';

// Internal dependencies
import { getPath } from 'routes';
import styles from './styles.scss';

const DefaultHeader = ( { children } ) => {
	return (
		<div>
			<header className={ styles.header }>
				<Link className={ styles.title } to={ getPath( 'home' ) }>
					<h1>MagicDomains</h1>
				</Link>
			</header>

			<div className={ styles.content }>
				{ children }
			</div>
		</div>
	);
};

DefaultHeader.propTypes = {
	children: PropTypes.node.isRequired
};

export default withStyles( styles )( DefaultHeader );
