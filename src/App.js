import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Paper,
  useMediaQuery,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';

function App() {
  const [url, setUrl] = useState('');
  const [imagesWithoutAlt, setImagesWithoutAlt] = useState([]);
  const [imagesWithAlt, setImagesWithAlt] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');

  const theme = createTheme({
    palette: {
      primary: {
        main: '#1976d2',
      },
      background: {
        default: '#f5f5f5',
      },
    },
    typography: {
      fontFamily: 'Roboto, sans-serif',
    },
  });

  const handleScan = () => {
    if (!url) {
      alert('Vă rugăm să introduceți un URL valid.');
      return;
    }

    // Resetăm rezultatele anterioare
    setImagesWithoutAlt([]);
    setImagesWithAlt([]);

    setLoading(true);
    fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error('Eroare la preluarea conținutului.');
      })
      .then((data) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        const images = doc.querySelectorAll('img');
        const imagesWithoutAlt = [];
        const imagesWithAlt = [];

        images.forEach((img) => {
          const src = img.getAttribute('src');
          if (!src) return; // Sărim peste imaginile fără atribut src
          const absoluteSrc = new URL(src, url).href;
          if (!img.hasAttribute('alt') || img.getAttribute('alt').trim() === '') {
            imagesWithoutAlt.push(absoluteSrc);
          } else {
            imagesWithAlt.push(absoluteSrc);
          }
        });

        setImagesWithoutAlt(imagesWithoutAlt);
        setImagesWithAlt(imagesWithAlt);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        alert('A apărut o eroare. Verificați consola pentru detalii.');
        setLoading(false);
      });
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static" sx={{ mb: 4 }}>
        <Toolbar>
          <ImageSearchIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            Verificare Imagini fără Atribut ALT
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Introduceți un URL pentru a scana imaginile fără atribut <code>alt</code>.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 2,
              mt: 2,
            }}
          >
            <TextField
              label="URL site"
              variant="outlined"
              fullWidth
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleScan}
              sx={{ minWidth: isMobile ? '100%' : '150px' }}
            >
              Scanează
            </Button>
          </Box>
          {loading && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Se încarcă...
              </Typography>
            </Box>
          )}
          {!loading && (imagesWithoutAlt.length > 0 || imagesWithAlt.length > 0) && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6">Rezultate:</Typography>
              <Typography variant="body1">
                Total imagini găsite: {imagesWithoutAlt.length + imagesWithAlt.length}
              </Typography>
              <Typography variant="body1">
                Imagini cu atribut alt: {imagesWithAlt.length}
              </Typography>
              <Typography variant="body1">
                Imagini fără atribut alt: {imagesWithoutAlt.length}
              </Typography>
              {imagesWithoutAlt.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Imagini fără atribut alt:
                  </Typography>
                  <List>
                    {imagesWithoutAlt.map((src, index) => (
                      <ListItem
                        key={index}
                        component="a"
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ListItemText primary={src} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          )}
          {!loading && imagesWithoutAlt.length === 0 && imagesWithAlt.length === 0 && (
            <Alert severity="info" sx={{ mt: 4 }}>
              Nu au fost găsite imagini sau site-ul nu a putut fi accesat.
            </Alert>
          )}
          {/* Textul de copyright */}
          <Typography variant="caption" display="block" sx={{ mt: 4, textAlign: 'center' }}>
            &copy; {new Date().getFullYear()} PGG WEB S.R.L.
          </Typography>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;
