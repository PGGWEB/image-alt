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
import axios from 'axios';
import robotsParser from 'robots-parser';

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

  const handleScanSite = async () => {
    if (!url) {
      alert('Vă rugăm să introduceți un URL valid.');
      return;
    }

    // Resetăm rezultatele anterioare
    setImagesWithoutAlt([]);
    setImagesWithAlt([]);
    setLoading(true);

    const visitedUrls = new Set();
    const urlsToVisit = [url];
    const domain = new URL(url).origin;

    // Preluăm și interpretăm robots.txt
    let robots;
    try {
      const robotsTxtUrl = `${domain}/robots.txt`;
      const response = await axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(robotsTxtUrl)}`);
      robots = robotsParser(robotsTxtUrl, response.data.contents);
    } catch (error) {
      console.error('Eroare la preluarea robots.txt. Continuăm fără a verifica robots.txt.', error);
      robots = robotsParser('', '');
    }

    // Funcție pentru a aștepta un timp specificat (pentru rate limiting)
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while (urlsToVisit.length > 0) {
      const currentUrl = urlsToVisit.shift();

      if (visitedUrls.has(currentUrl)) {
        continue;
      }

      visitedUrls.add(currentUrl);

      // Verificăm dacă URL-ul este permis de robots.txt
      const isAllowed = robots.isAllowed(currentUrl, '*');
      if (!isAllowed) {
        console.log(`Accesul la ${currentUrl} este interzis de robots.txt.`);
        continue;
      }

      try {
        // Așteptăm 500ms între solicitări pentru a nu supraîncărca serverul
        await delay(500);

        const response = await axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(currentUrl)}`);
        const data = response.data;

        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');

        // Verificăm imaginile de pe pagina curentă
        const images = doc.querySelectorAll('img');
        images.forEach((img) => {
          const src = img.getAttribute('src');
          if (!src) return;
          const absoluteSrc = new URL(src, currentUrl).href;
          if (!img.hasAttribute('alt') || img.getAttribute('alt').trim() === '') {
            setImagesWithoutAlt((prev) => [...prev, absoluteSrc]);
          } else {
            setImagesWithAlt((prev) => [...prev, absoluteSrc]);
          }
        });

        // Extragem link-urile interne
        const links = doc.querySelectorAll('a[href]');
        links.forEach((link) => {
          const href = link.getAttribute('href');
          if (href) {
            const absoluteHref = new URL(href, currentUrl).href;
            // Verificăm dacă link-ul este în același domeniu și nu este un fragment (#)
            if (absoluteHref.startsWith(domain) && !absoluteHref.includes('#')) {
              urlsToVisit.push(absoluteHref);
            }
          }
        });
      } catch (error) {
        console.error(`Eroare la accesarea ${currentUrl}:`, error);
      }
    }

    setLoading(false);
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
            Introduceți un URL pentru a scana întregul site pentru imagini fără atribut <code>alt</code>.
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
              onClick={handleScanSite}
              sx={{ minWidth: isMobile ? '100%' : '150px' }}
            >
              Scanează Site-ul
            </Button>
          </Box>
          {loading && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Se scanează site-ul. Acest proces poate dura câteva minute...
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
