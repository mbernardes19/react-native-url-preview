import React from 'react';
import { getLinkPreview } from 'link-preview-js';
import PropTypes from 'prop-types';
import { Image, Linking, Platform, Text, TouchableOpacity, View, ViewPropTypes } from 'react-native';
import blankImage from './blank.jpg';
import SvgUri from 'react-native-svg-uri';

const REGEX = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/g;

const DefaultImage = ({imageStyle, imageProps}) => <Image style={imageStyle} source={blankImage} {...imageProps} />;

export default class RNUrlPreview extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isUri: false,
      linkTitle: undefined,
      linkDesc: undefined,
      linkFavicon: undefined,
      linkImg: undefined,
      imageRenderingFailed: false,
    };
  }

  componentDidMount() {
    this.getPreview(this.props.source, this.props.requestOptions);
  }

  _renderUrlForDisplay(url, siteName) {
    if (!siteName) {
      const domain = url.replace('http://', '').replace('https://', '').replace('www.', '').split(/[/?#]/)[0];
      const domainName = domain.replace(domain.charAt(0), domain.charAt(0).toUpperCase());
      const domainTerminator = domain.split('.')[1];
      return `${domainName}.${domainTerminator}`;
    }
    const isSpaced = siteName => !!siteName.split(' ')[1];
    const hasTwoUppercasedWords = siteName => siteName.split(' ')[1].charAt(0).toUpperCase() === siteName.split(' ')[1].charAt(0);

    let domainName = '';
    if (isSpaced(siteName) && hasTwoUppercasedWords(siteName)) {
      domainName = siteName.replace(/\s/g, '');
    } else {
      domainName = siteName.split(' ')[0];
    }

    const domain = url.replace('http://', '').replace('https://', '').replace('www.', '').split(/[/?#]/)[0];
    const domainTerminator = domain.split('.')[1];

    return `${domainName}.${domainTerminator}`;
  }

  _parseData = (rawData) => {
    if (!rawData.siteName) {
      const domain = rawData.url.replace('http://', '').replace('https://', '').replace('www.', '').split(/[/?#]/)[0];
      const siteName = domain.replace(domain.charAt(0), domain.charAt(0).toUpperCase()).split('.')[0];
      return {
        ...rawData,
        siteName,
      };
    }
    return rawData;
  }

  _handleLinkData = (data, onLoad) => {
    console.log('DATA', data)
    const parsedData = this._parseData(data);
    if (onLoad) {
      onLoad(parsedData);
    }
    this.setState({
      isUri: true,
      linkTitle: parsedData.title ? parsedData.title : undefined,
      linkDesc: parsedData.url ? this._renderUrlForDisplay(parsedData.url, parsedData.siteName) : undefined,
      linkImg:
      parsedData.images && parsedData.images.length > 0
        ? parsedData.images.find(function(element) {
          return element.includes('.png') || element.includes('.jpg') || element.includes('.jpeg');
        }) || parsedData.images[0]
        : undefined,
      linkFavicon: parsedData.favicons && parsedData.favicons.length > 0 ? parsedData.favicons[parsedData.favicons.length - 1] : undefined,
    });
  }

  getPreview = (source, options) => {
    const { onError, onLoad } = this.props;
    if (typeof source !== 'string') {
      try {
        this._handleLinkData(source, onLoad);
      } catch (err) {
        console.log(err);
        onError(err);
        this.setState({ isUri: false });
      }
    } else {
      getLinkPreview(source, options)
        .then(data => this._handleLinkData(data, onLoad))
        .catch(error => {
          onError(error);
          this.setState({ isUri: false });
        });
    }
  };

  componentDidUpdate(nextProps) {
    if (nextProps.source !== this.props.source) {
      this.getPreview(nextProps.source);
    } else if (nextProps.source == null) {
      this.setState({ isUri: false });
    }
  }

  _onLinkPressed = () => {
    if (typeof this.props.source !== 'string') {
      Linking.openURL(this.props.source.url);
    } else {
      Linking.openURL(this.props.source.match(REGEX)[0]);
    }
  };

  renderImage = (imageLink, faviconLink, imageStyle, faviconStyle, imageProps) => {
    if (imageLink && imageLink.includes('.svg')) {
      return <SvgUri width="150" height="95" source={{ uri: imageLink }}/>;
    }
    if (imageLink && !this.state.imageRenderingFailed) {
      return <Image style={imageStyle} source={{ uri: imageLink }} onError={() => this.setState({ imageRenderingFailed: true })} {...imageProps} />;
    } else if (imageLink && this.state.imageRenderingFailed) {
      return <DefaultImage imageStyle={imageStyle} imageProps={imageProps} />;
    } else if (faviconLink && !this.state.imageRenderingFailed) {
      return <Image style={faviconStyle} source={{ uri: faviconLink }} onError={() => this.setState({ imageRenderingFailed: true })} {...imageProps} />;
    } else {
      return <DefaultImage imageStyle={imageStyle} imageProps={imageProps} />;
    };
  };

  renderText = (showTitle, showDescription, title, description, textContainerStyle, titleStyle, descriptionStyle, titleNumberOfLines, descriptionNumberOfLines) => {
    return (
      <View style={textContainerStyle}>
        {showTitle && (
          <Text numberOfLines={titleNumberOfLines} style={titleStyle}>
            {title}
          </Text>
        )}
        {showDescription && (
          <Text numberOfLines={descriptionNumberOfLines} style={descriptionStyle}>
            {description}
          </Text>
        )}
      </View>
    );
  };

  renderLinkPreview = (
    containerStyle,
    imageLink,
    faviconLink,
    imageStyle,
    faviconStyle,
    showTitle,
    showDescription,
    title,
    description,
    textContainerStyle,
    titleStyle,
    descriptionStyle,
    titleNumberOfLines,
    descriptionNumberOfLines,
    imageProps,
  ) => {
    return (
      <TouchableOpacity style={[styles.containerStyle, containerStyle]} activeOpacity={0.9} onPress={() => this._onLinkPressed()}>
        {this.renderImage(imageLink, faviconLink, imageStyle, faviconStyle, imageProps)}
        {this.renderText(showTitle, showDescription, title, description, textContainerStyle, titleStyle, descriptionStyle, titleNumberOfLines, descriptionNumberOfLines)}
      </TouchableOpacity>
    );
  };

  render() {
    const {
      source,
      containerStyle,
      imageStyle,
      faviconStyle,
      textContainerStyle,
      title,
      description,
      titleStyle,
      titleNumberOfLines,
      descriptionStyle,
      descriptionNumberOfLines,
      imageProps,
    } = this.props;
    return this.state.isUri
      ? this.renderLinkPreview(
        containerStyle,
        this.state.linkImg,
        this.state.linkFavicon,
        imageStyle,
        faviconStyle,
        title,
        description,
        this.state.linkTitle,
        this.state.linkDesc,
        textContainerStyle,
        titleStyle,
        descriptionStyle,
        titleNumberOfLines,
        descriptionNumberOfLines,
        imageProps,
      )
      : null;
  }
}

const styles = {
  containerStyle: {
    flexDirection: 'row',
  },
};

RNUrlPreview.defaultProps = {
  onLoad: () => {},
  onError: () => {},
  source: null,
  requestOptions: {},
  containerStyle: {
    backgroundColor: 'rgba(239, 239, 244,0.62)',
    alignItems: 'center',
  },
  imageStyle: {
    width: Platform.isPad ? 160 : 110,
    height: Platform.isPad ? 160 : 110,
    paddingRight: 10,
    paddingLeft: 10,
  },
  faviconStyle: {
    width: 40,
    height: 40,
    paddingRight: 10,
    paddingLeft: 10,
  },
  textContainerStyle: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 10,
  },
  title: true,
  description: true,
  titleStyle: {
    fontSize: 17,
    color: '#000',
    marginRight: 10,
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  titleNumberOfLines: 2,
  descriptionStyle: {
    fontSize: 14,
    color: '#81848A',
    marginRight: 10,
    alignSelf: 'flex-start',
  },
  descriptionNumberOfLines: Platform.isPad ? 4 : 3,
  imageProps: { resizeMode: 'contain' },
};

RNUrlPreview.propTypes = {
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  source: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      id: PropTypes.string,
      url: PropTypes.string,
      title: PropTypes.string,
      siteName: PropTypes.string,
      description: PropTypes.string,
      images: PropTypes.arrayOf(PropTypes.string),
      mediaType: PropTypes.string,
      contentType: PropTypes.string,
      videos: PropTypes.arrayOf(PropTypes.string),
      favicons: PropTypes.arrayOf(PropTypes.string),
    }),
  ]),
  containerStyle: ViewPropTypes.style,
  imageStyle: ViewPropTypes.style,
  faviconStyle: ViewPropTypes.style,
  textContainerStyle: ViewPropTypes.style,
  title: PropTypes.bool,
  description: PropTypes.bool,
  titleStyle: Text.propTypes.style,
  titleNumberOfLines: Text.propTypes.numberOfLines,
  descriptionStyle: Text.propTypes.style,
  descriptionNumberOfLines: Text.propTypes.numberOfLines,
  requestOptions: PropTypes.shape({
    headers: PropTypes.objectOf(PropTypes.string),
    imagesPropertyType: PropTypes.string,
    proxyUrl: PropTypes.string,
  }),
};
