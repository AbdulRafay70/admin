import React, { useEffect } from 'react';

/**
 * Component to apply custom blog styles dynamically
 * Loads Google Fonts and injects custom CSS
 */
const BlogStyleApplier = ({ customStyles, language }) => {
    useEffect(() => {
        // Load Google Fonts if specified
        if (customStyles?.typography) {
            const { headingFont, bodyFont } = customStyles.typography;
            const fonts = [];

            if (headingFont && headingFont !== 'Arial' && headingFont !== 'Helvetica') {
                fonts.push(headingFont);
            }
            if (bodyFont && bodyFont !== 'Arial' && bodyFont !== 'Helvetica' && bodyFont !== headingFont) {
                fonts.push(bodyFont);
            }

            // Load fonts from Google Fonts
            if (fonts.length > 0) {
                const fontLink = document.createElement('link');
                fontLink.href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f.replace(/ /g, '+')}:wght@300;400;500;600;700`).join('&')}&display=swap`;
                fontLink.rel = 'stylesheet';
                fontLink.id = 'blog-custom-fonts';

                // Remove existing font link if any
                const existingLink = document.getElementById('blog-custom-fonts');
                if (existingLink) {
                    existingLink.remove();
                }

                document.head.appendChild(fontLink);
            }
        }

        // Inject custom CSS
        if (customStyles?.customCSS) {
            const styleElement = document.createElement('style');
            styleElement.id = 'blog-custom-css';
            styleElement.textContent = customStyles.customCSS;

            // Remove existing custom CSS if any
            const existingStyle = document.getElementById('blog-custom-css');
            if (existingStyle) {
                existingStyle.remove();
            }

            document.head.appendChild(styleElement);
        }

        // Cleanup on unmount
        return () => {
            const fontLink = document.getElementById('blog-custom-fonts');
            const styleElement = document.getElementById('blog-custom-css');
            if (fontLink) fontLink.remove();
            if (styleElement) styleElement.remove();
        };
    }, [customStyles]);

    // Generate inline styles for the blog container
    const getContainerStyles = () => {
        if (!customStyles) return {};

        const { colors, typography, layout } = customStyles;
        const styles = {};

        if (colors) {
            if (colors.background) styles.backgroundColor = colors.background;
            if (colors.text) styles.color = colors.text;
        }

        if (typography) {
            if (typography.bodyFont) styles.fontFamily = typography.bodyFont;
            if (typography.fontSize?.body) styles.fontSize = typography.fontSize.body;
            if (typography.lineHeight) styles.lineHeight = typography.lineHeight;
        }

        if (layout) {
            if (layout.containerWidth) styles.maxWidth = layout.containerWidth;
            if (layout.contentAlignment) styles.textAlign = layout.contentAlignment;
        }

        // RTL support for Urdu and Arabic
        if (language === 'ur' || language === 'ar') {
            styles.direction = 'rtl';
            styles.textAlign = 'right';
        }

        return styles;
    };

    const getHeadingStyles = () => {
        if (!customStyles?.typography) return {};

        const { headingFont, fontWeight, fontSize } = customStyles.typography;
        const styles = {};

        if (headingFont) styles.fontFamily = headingFont;
        if (fontWeight?.heading) styles.fontWeight = fontWeight.heading;

        return styles;
    };

    const getLinkStyles = () => {
        if (!customStyles?.colors?.link) return {};
        return { color: customStyles.colors.link };
    };

    // Return style objects for use in components
    return {
        containerStyles: getContainerStyles(),
        headingStyles: getHeadingStyles(),
        linkStyles: getLinkStyles(),
        colors: customStyles?.colors || {},
        typography: customStyles?.typography || {},
        layout: customStyles?.layout || {}
    };
};

export default BlogStyleApplier;
