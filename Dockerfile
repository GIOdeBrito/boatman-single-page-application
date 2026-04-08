# Use the official PHP 8.3 image with Apache
FROM php:8.3-apache

# Enables the rewrite module for .htaccess
RUN a2enmod rewrite

# Expose port 80
EXPOSE 80