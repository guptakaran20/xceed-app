import React, { useState } from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { downloadFileNative, isNativeApp } from '../utils/nativeCapabilities';

const FileDownloadButton = ({ fileUrl, fileName }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const toast = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (isNativeApp()) {
        await downloadFileNative(fileUrl, fileName);
        toast({
          status: 'success',
          title: 'Download started',
          description: `${fileName} will appear in your Downloads folder.`,
          duration: 3500,
          isClosable: true,
        });
      } else {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.click();
      }
    } catch (e) {
      console.error(e);
      toast({
        status: 'error',
        title: 'Download could not start',
        description: 'Please check your internet connection and try again.',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      colorScheme="blue"
      onClick={handleDownload}
      size="md"
      px="12"
      py="5"
      borderRadius="lg"
      fontWeight="600"
      boxShadow="sm"
      _hover={{
        boxShadow: 'md',
        transform: 'translateY(-1px)',
      }}
      _active={{
        boxShadow: 'sm',
        transform: 'translateY(0)',
      }}
      isLoading={isDownloading}
      loadingText="Downloading..."
    >
      Download {fileName}
    </Button>
  );
};

export default FileDownloadButton;
