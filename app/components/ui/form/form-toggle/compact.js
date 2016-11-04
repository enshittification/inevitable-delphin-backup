/**
 * External dependencies
 */
import React, { PropTypes } from 'react';
import classNames from 'classnames';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import omit from 'lodash/omit';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import Toggle from './index';

const CompactFormToggle = ( props ) => (
	<Toggle
		{ ...omit( props, 'className' ) }
		className={ classNames( props.className, 'is-compact' ) }
	>
		{ this.props.children }
	</Toggle>
);

CompactFormToggle.propTypes = {
	className: PropTypes.string.isRequired
};

export default withStyles( styles )( CompactFormToggle );
