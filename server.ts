import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import AdmZip from "adm-zip";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Gemini
let aiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in the environment. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. Health check & API state
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    currentTime: new Date().toISOString()
  });
});

// 2. Generate Blog Post Content with full options
app.post("/api/ai/generate-content", async (req, res) => {
  try {
    const {
      title,
      language = "Hungarian",
      headings = [],
      temperature = 0.7,
      maxTokens = 1500,
      topP = 0.9,
      tone = "professional",
      style = "informative",
      keywords = [],
      avoidKeywords = [],
      makeKeywordsBold = false,
      addQa = false,
      addCta = false,
      ctaLabel = "Read More",
      ctaUrl = "#",
      introCustomText = "",
      outroCustomText = ""
    } = req.body;

    const ai = getGemini();

    const headingOutline = headings.length > 0 
      ? `Generate content structured under these exact headings: ${headings.join(", ")}`
      : "Choose appropriate hierarchical headings (H2, H3) for the article.";

    const keywordInstruction = keywords.length > 0
      ? `Try to naturally weave in these keywords: ${keywords.join(", ")}.${makeKeywordsBold ? " Make these keywords **bold** where they appear." : ""}`
      : "";

    const avoidInstruction = avoidKeywords.length > 0
      ? `Do NOT use or mention these keywords/phrases: ${avoidKeywords.join(", ")}.`
      : "";

    const qaInstruction = addQa
      ? "At the end of the article, include a detailed Q&A (Frequently Asked Questions) section with 3-4 highly relevant questions and answers."
      : "";

    const ctaInstruction = addCta
      ? `Include a prominent HTML styled CTA (Call to Action) button at the end saying "${ctaLabel}" pointing to "${ctaUrl}". Format it inside a neat card layout.`
      : "";

    const introInstruction = introCustomText 
      ? `Begin with a custom introduction based on this guide: "${introCustomText}".`
      : "Begin with an engaging introduction.";

    const outroInstruction = outroCustomText 
      ? `End with a custom conclusion based on this guide: "${outroCustomText}".`
      : "End with a powerful concluding section.";

    const prompt = `
      Write a comprehensive, high-quality, long-form WordPress article in ${language} language.
      Topic/Title: ${title}
      
      Tone of voice: ${tone}
      Writing style: ${style}
      
      Structure & Outlining:
      - ${headingOutline}
      - ${introInstruction}
      - ${outroInstruction}
      - ${keywordInstruction}
      - ${avoidInstruction}
      - ${qaInstruction}
      - ${ctaInstruction}

      IMPORTANT: Output the content in clean WordPress Gutenberg block-ready HTML format (using <p>, <h2>, <h3>, <ul>, <li>, <strong>, <em>, <a>, and custom CTA button containers if CTA is requested). Do not output markdown code blocks like \`\`\`html. Output ONLY the raw HTML string representing the body of the article. Let it be engaging, informative, and naturally written.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: parseFloat(temperature),
        topP: parseFloat(topP),
      }
    });

    const generatedHtml = response.text || "<p>Generation failed. No output text received.</p>";
    
    // Auto generate a short excerpt
    const excerptResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Create a brief, engaging, search-engine-friendly excerpt (1-2 sentences, max 160 characters) in ${language} from this content: ${generatedHtml.substring(0, 1000)}`
    });

    // Auto generate keywords & tags
    let generatedKeywordsList: string[] = [];
    try {
      const keywordsResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Based on this article title: "${title}" and content: "${generatedHtml.substring(0, 1200)}", generate 5 to 8 highly relevant, search-engine-friendly SEO tags/keywords in ${language}. Return them strictly as a JSON array of strings. Do not include hash symbols or other formatting.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      generatedKeywordsList = JSON.parse(keywordsResponse.text || "[]");
    } catch (kwError) {
      console.error("Keywords generation error, falling back:", kwError);
      // Fallback
      generatedKeywordsList = title.split(/\s+/)
        .map((w: string) => w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").trim())
        .filter((w: string) => w.length > 3)
        .slice(0, 6);
    }

    res.json({
      success: true,
      html: generatedHtml,
      excerpt: excerptResponse.text?.trim() || "A generated article about " + title,
      generatedKeywords: generatedKeywordsList
    });
  } catch (error: any) {
    console.error("Content generation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Generate Image with specific configuration & Art Styles
app.post("/api/ai/generate-image", async (req, res) => {
  try {
    const { prompt, artStyle = "photorealistic", aspectRatio = "1:1" } = req.body;
    const ai = getGemini();

    const visualPrompt = `A high-quality visual of: ${prompt}. Styled as a ${artStyle} artwork, highly detailed, perfect composition, vibrant colors, suitable for a WordPress featured image.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: visualPrompt,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    });

    let base64Image = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Image) {
      // Return a backup nice placeholder image seed or search grounding if missing
      throw new Error("No image was returned by the model. Make sure you have a paid model API key selected if needed.");
    }

    res.json({
      success: true,
      imageUrl: `data:image/png;base64,${base64Image}`
    });
  } catch (error: any) {
    console.error("Image generation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. WooCommerce Product Optimizer
app.post("/api/ai/optimize-product", async (req, res) => {
  try {
    const { title, description, category, keywords = [] } = req.body;
    const ai = getGemini();

    const prompt = `
      You are an expert WooCommerce SEO copywriter. Optimize the following product for maximum conversion and search visibility:
      Current Title: ${title}
      Current Description: ${description}
      Category: ${category}
      Target Keywords: ${keywords.join(", ")}

      Provide your output strictly in JSON format matching this schema:
      {
        "optimizedTitle": "A catchy, SEO optimized title under 60 chars",
        "optimizedDescription": "A rich, persuasive description (HTML formatted, paragraphs, lists)",
        "optimizedShortDescription": "A punchy, short bulleted summary (1-2 paragraphs or bullet list) for the product summary section"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimizedTitle: { type: Type.STRING },
            optimizedDescription: { type: Type.STRING },
            optimizedShortDescription: { type: Type.STRING }
          },
          required: ["optimizedTitle", "optimizedDescription", "optimizedShortDescription"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error("Product optimization error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Suggest SEO Titles
app.post("/api/ai/suggest-titles", async (req, res) => {
  try {
    const { topic, type = "post" } = req.body;
    const ai = getGemini();

    const prompt = `
      Suggest 5 catchy, viral, SEO-friendly titles for a WordPress ${type} about: "${topic}".
      Return them strictly in a JSON list of strings.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const parsed = JSON.parse(response.text || "[]");
    res.json({ success: true, titles: parsed });
  } catch (error: any) {
    console.error("Title suggestions error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Interactive Chat with simulated pinecone embedding search
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages = [], systemPrompt, associatedEmbeddings = [], isModerationEnabled = false } = req.body;
    const ai = getGemini();

    // If moderation is enabled, do a quick sanity check
    if (isModerationEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1].content;
      const moderationResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Is this message safe, polite, and free of hate speech, violence, or dangerous requests? Message: "${lastMessage}". Respond with exactly "SAFE" or "FLAGGED".`
      });

      if (moderationResponse.text?.trim().includes("FLAGGED")) {
        return res.json({
          success: true,
          response: "Sajnálom, de a rendszerünk moderációs szűrője ezt az üzenetet nem biztonságosnak vagy nem megfelelőnek minősítette. Kérlek, fogalmazd meg másképp a kérdésedet.",
          moderated: true
        });
      }
    }

    // Build context from associated mock embeddings
    let contextStr = "";
    if (associatedEmbeddings.length > 0) {
      contextStr = `\nUse this context retrieved from your WordPress site's knowledge base:\n` + 
        associatedEmbeddings.map((emb: any) => `- Title: ${emb.title}\n  Content: ${emb.content}`).join("\n");
    }

    const fullSystemPrompt = `${systemPrompt}${contextStr}\nAlways respond in Hungarian or the language requested by the user. Keep formatting clean.`;

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: fullSystemPrompt,
      }
    });

    let lastModelResponse = "";
    // Feed previous messages except last
    for (let i = 0; i < messages.length - 1; i++) {
      // Just keep track or pre-populate if needed, but for simplicity let's feed the final prompt or full convo
    }

    // Call chat send with the last message
    const lastUserMsg = messages[messages.length - 1]?.content || "Helló";
    const response = await chat.sendMessage({ message: lastUserMsg });

    res.json({
      success: true,
      response: response.text
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Whisper Audio Speech-to-Post Simulator endpoint
app.post("/api/ai/speech-to-post", async (req, res) => {
  const { mockAudioTopic = "Bambusz kiegészítők", instructions = "" } = req.body || {};
  try {
    const ai = getGemini();

    const prompt = `
      Simulate transcribing an audio file where a creator is dictating a post about: "${mockAudioTopic}".
      Creator's guide instructions: "${instructions}".
      
      First, output a transcription block simulating their raw voice input (with natural pauses, filler words).
      Then, output a fully structured, professionally formatted WordPress blog post written in Hungarian, translating their raw voice thoughts into polished content (H2s, H3s, bullet list).
      Also, generate 5 to 8 highly relevant SEO keywords/tags for this post.
      
      Return your result strictly in JSON matching this schema:
      {
        "transcript": "Raw transcribed spoken audio...",
        "title": "Optimized Post Title",
        "postContent": "Polished WordPress Gutenberg HTML content...",
        "keywords": ["tag1", "tag2", "tag3", "tag4", "tag5"]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            title: { type: Type.STRING },
            postContent: { type: Type.STRING },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["transcript", "title", "postContent", "keywords"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error("Speech to post error:", error);
    // Fallback
    const fallbackList = mockAudioTopic.split(/\s+/)
      .map((w: string) => w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").trim())
      .filter((w: string) => w.length > 3)
      .slice(0, 5);
    res.json({
      success: true,
      transcript: `[Hangfelvétel transzkripció szimulációja - ${mockAudioTopic}]\n"Sziasztok! Ma arról szeretnék beszélni..."`,
      title: `Optimális bejegyzés: ${mockAudioTopic}`,
      postContent: `<h2>Bevezető</h2><p>Bespoke WordPress cikk a(z) ${mockAudioTopic} témájáról részletesebben...</p>`,
      keywords: fallbackList
    });
  }
});

// 8. Standalone Automatic Keyword & Tag Generator endpoint
app.post("/api/ai/generate-keywords", async (req, res) => {
  const { title = "Cikk", content = "", language = "Magyar" } = req.body || {};
  try {
    const ai = getGemini();

    const prompt = `
      Based on the following article title: "${title}" ${content ? `and snippet content: "${content.substring(0, 800)}"` : ''},
      generate 5 to 8 highly relevant, search-engine-friendly SEO tags/keywords in the language "${language}".
      Return them strictly as a JSON array of strings. Do not include hash symbols (#) or other formatting.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const parsed = JSON.parse(response.text || "[]");
    res.json({ success: true, keywords: parsed });
  } catch (error: any) {
    console.error("Independent keyword generation error:", error);
    const fallbackList = title.split(/\s+/)
      .map((w: string) => w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").trim())
      .filter((w: string) => w.length > 3)
      .slice(0, 6);
    res.json({ success: true, keywords: fallbackList, fallback: true });
  }
});

// 9. Downloadable WordPress Plugin Zip Generator Endpoint
app.get("/api/download-wp-plugin", (req, res) => {
  try {
    const zip = new AdmZip();
    
    const phpCode = `<?php
/**
 * Plugin Name: WP AI Suite - Integrációs Bővítmény
 * Plugin URI: https://ai.studio/build
 * Description: Teljes körű WordPress és WooCommerce mesterséges intelligencia integráció. Biztonságos REST API-n keresztül szinkronizálja a generált cikkeket, képeket és WooCommerce termékeket közvetlenül a WP AI Suite külső felületről.
 * Version: 1.0.0
 * Author: WP AI Suite Csapat
 * Author URI: https://ai.studio/build
 * License: GPL2
 * Text Domain: wp-ai-suite
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// 1. Aktiváláskor generáljunk egy egyedi biztonsági kulcsot (Sync Token)
register_activation_hook(__FILE__, 'wp_ai_suite_activate');
function wp_ai_suite_activate() {
    if (!get_option('wp_ai_suite_sync_token')) {
        $token = bin2hex(random_bytes(16));
        update_option('wp_ai_suite_sync_token', $token);
    }
}

// 2. Admin menü hozzáadása
add_action('admin_menu', 'wp_ai_suite_add_admin_menu');
function wp_ai_suite_add_admin_menu() {
    add_menu_page(
        'WP AI Suite',
        'WP AI Suite',
        'manage_options',
        'wp-ai-suite',
        'wp_ai_suite_admin_page',
        'dashicons-superhero',
        80
    );
}

// 3. Admin felület megjelenítése
function wp_ai_suite_admin_page() {
    // Kulcs frissítésének kezelése
    if (isset($_POST['wp_ai_suite_regenerate_token']) && check_admin_referer('wp_ai_suite_regen_action', 'wp_ai_suite_regen_nonce')) {
        $new_token = bin2hex(random_bytes(16));
        update_option('wp_ai_suite_sync_token', $new_token);
        echo '<div class="notice notice-success is-dismissible"><p>Az új szinkronizációs kulcs sikeresen legenerálva!</p></div>';
    }

    $token = get_option('wp_ai_suite_sync_token');
    if (!$token) {
        $token = bin2hex(random_bytes(16));
        update_option('wp_ai_suite_sync_token', $token);
    }
    
    $rest_url_post = esc_url(get_rest_url(null, 'wp-ai-suite/v1/publish-post'));
    $rest_url_prod = esc_url(get_rest_url(null, 'wp-ai-suite/v1/publish-product'));
    $is_woo_active = class_exists('WooCommerce') ? 'Igen (Aktív)' : 'Nem aktív';
    ?>
    <div class="wrap" style="max-width: 900px; margin-top: 20px; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen-Sans, Ubuntu, Cantarell, \"Helvetica Neue\", sans-serif;">
        <h1 style="font-weight: 800; color: #1e1e2f; display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
            <span class="dashicons dashicons-superhero" style="font-size: 32px; width: 32px; height: 32px; color: #4f46e5; margin-top: 4px;"></span>
            WP AI Suite Integrációs Bővítmény
        </h1>
        <p class="description" style="font-size: 14px; color: #64748b;">Ez a bővítmény lehetővé teszi a biztonságos, egykattintásos bejegyzés- és WooCommerce termék-szinkronizációt a külső WP AI Suite felületről.</p>

        <div style="background: #fff; border: 1px solid #ccd0d4; padding: 25px; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
            <h2 style="margin-top: 0; color: #4f46e5; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px; font-size: 18px; font-weight: 700;">Integrációs Adatok</h2>
            <p style="font-size: 13px; color: #475569;">Másold ki az alábbi kulcsot és az API végpontokat, majd illeszd be őket a WP AI Suite külső alkalmazásbeállításaiba (a WordPress Integráció menüpontban) a szinkronizáció engedélyezéséhez.</p>
            
            <table class="form-table" style="margin-top: 20px; width: 100%;">
                <tr valign="top">
                    <th scope="row" style="width: 250px; font-weight: bold; text-align: left; padding: 15px 0; font-size: 14px;">Szinkronizációs Kulcs (Token)</th>
                    <td style="padding: 15px 0;">
                        <code style="background: #f1f5f9; padding: 8px 14px; border-radius: 6px; font-size: 14px; font-family: monospace; font-weight: bold; border: 1px solid #cbd5e1; display: inline-block; word-break: break-all; color: #0f172a;">
                            <?php echo esc_html($token); ?>
                        </code>
                        <form method="post" style="display: inline-block; margin-left: 10px; vertical-align: middle;">
                            <?php wp_nonce_field('wp_ai_suite_regen_action', 'wp_ai_suite_regen_nonce'); ?>
                            <input type="submit" name="wp_ai_suite_regenerate_token" class="button button-secondary" style="border-radius: 6px; font-weight: 600;" value="Új kulcs generálása" onclick="return confirm('Biztosan új kulcsot akarsz generálni? A régi kulccsal rendelkező szinkronizációk meg fognak szakadni.');">
                        </form>
                        <p class="description" style="margin-top: 8px; color: #64748b; font-size: 12px;">Ez a titkos kulcs biztosítja, hogy csak a te engedélyezett WP AI Suite alkalmazásod tudjon cikkeket írni az oldaladra.</p>
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row" style="font-weight: bold; text-align: left; padding: 15px 0; font-size: 14px;">Cikkíró API Végpont</th>
                    <td style="padding: 15px 0;">
                        <code style="background: #f8fafc; padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 13px; color: #334155; display: inline-block; width: 100%; max-width: 500px; box-sizing: border-box; overflow-x: auto;"><?php echo esc_html($rest_url_post); ?></code>
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row" style="font-weight: bold; text-align: left; padding: 15px 0; font-size: 14px;">WooCommerce Termék Végpont</th>
                    <td style="padding: 15px 0;">
                        <code style="background: #f8fafc; padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 13px; color: #334155; display: inline-block; width: 100%; max-width: 500px; box-sizing: border-box; overflow-x: auto;"><?php echo esc_html($rest_url_prod); ?></code>
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row" style="font-weight: bold; text-align: left; padding: 15px 0; font-size: 14px;">WooCommerce Telepítve?</th>
                    <td style="padding: 15px 0; font-size: 13px;">
                        <span style="font-weight: bold; padding: 4px 10px; border-radius: 100px; font-size: 12px; background: <?php echo class_exists('WooCommerce') ? '#ecfdf5' : '#fff1f2'; ?>; color: <?php echo class_exists('WooCommerce') ? '#059669' : '#e11d48'; ?>; border: 1px solid <?php echo class_exists('WooCommerce') ? '#a7f3d0' : '#fecdd3'; ?>;">
                            <?php echo esc_html($is_woo_active); ?>
                        </span>
                    </td>
                </tr>
            </table>
        </div>

        <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 20px; border-radius: 0 12px 12px 0; margin-top: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
            <h3 style="margin-top: 0; color: #0f172a; font-size: 15px; font-weight: bold;">Hogyan kell használni?</h3>
            <ol style="margin: 10px 0 0 15px; padding: 0; font-size: 13px; color: #475569; line-height: 1.6;">
                <li>Menj vissza a <strong>WP AI Suite</strong> külső webalkalmazásba.</li>
                <li>Nyisd meg a <strong>WordPress Integráció</strong> menüpontot a bal oldali sávban.</li>
                <li>Írd be a WordPress weboldalad alapértelmezett URL címét (pl.: <code>https://sajatoldalam.hu</code>) és másold be a fenti <strong>Szinkronizációs Kulcsot (Token)</strong>.</li>
                <li>Ezután az AI Cikkíró, Tömeges Szerkesztő és WooCommerce AI oldalakon megjelenik az <strong>"Azonnali Közzététel WordPress-ben"</strong> gomb, amivel egy kattintással átküldheted a tartalmat!</li>
            </ol>
        </div>
    </div>
    <?php
}

// 4. REST API végpontok regisztrálása
add_action('rest_api_init', 'wp_ai_suite_register_rest_routes');
function wp_ai_suite_register_rest_routes() {
    register_rest_route('wp-ai-suite/v1', '/publish-post', array(
        'methods' => 'POST',
        'callback' => 'wp_ai_suite_handle_publish_post',
        'permission_callback' => 'wp_ai_suite_check_rest_permission'
    ));
    register_rest_route('wp-ai-suite/v1', '/publish-product', array(
        'methods' => 'POST',
        'callback' => 'wp_ai_suite_handle_publish_product',
        'permission_callback' => 'wp_ai_suite_check_rest_permission'
    ));
}

// 5. Biztonsági hitelesítés ellenőrzése (Token alapú auth)
function wp_ai_suite_check_rest_permission($request) {
    $auth_header = $request->get_header('Authorization');
    $token_param = $request->get_param('token');
    $saved_token = get_option('wp_ai_suite_sync_token');
    
    if (empty($saved_token)) {
        return false;
    }
    
    // Authorization: Bearer <token> formátum ellenőrzése
    if ($auth_header) {
        if (preg_match('/Bearer\\s(\\S+)/', $auth_header, $matches)) {
            if (hash_equals($saved_token, $matches[1])) {
                return true;
            }
        }
    }
    
    // Paraméterben átadott token ellenőrzése (?token=...)
    if ($token_param && hash_equals($saved_token, $token_param)) {
        return true;
    }
    
    return new WP_Error('rest_forbidden', 'Érvénytelen vagy hiányzó WP AI Suite szinkronizációs kulcs!', array('status' => 401));
}

// 6. Cikk publikálás kezelője
function wp_ai_suite_handle_publish_post($request) {
    $params = $request->get_json_params();
    if (empty($params)) {
        $params = $request->get_body_params();
    }
    
    $title = !empty($params['title']) ? sanitize_text_field($params['title']) : '';
    $content = !empty($params['content']) ? wp_kses_post($params['content']) : '';
    $excerpt = !empty($params['excerpt']) ? sanitize_text_field($params['excerpt']) : '';
    $status = !empty($params['status']) ? sanitize_text_field($params['status']) : 'draft';
    $author_id = !empty($params['author_id']) ? intval($params['author_id']) : 1;
    
    if (empty($title)) {
        return new WP_REST_Response(array('success' => false, 'message' => 'A cikk címe nem lehet üres!'), 400);
    }
    
    // Új bejegyzés létrehozása
    $post_data = array(
        'post_title'    => $title,
        'post_content'  => $content,
        'post_excerpt'  => $excerpt,
        'post_status'   => $status,
        'post_author'   => $author_id,
        'post_type'     => 'post'
    );
    
    $post_id = wp_insert_post($post_data);
    
    if (is_wp_error($post_id)) {
        return new WP_REST_Response(array('success' => false, 'message' => $post_id->get_error_message()), 500);
    }
    
    // Kategóriák kezelése
    if (!empty($params['category'])) {
        $category = sanitize_text_field($params['category']);
        $cat_id = wp_create_category($category);
        if ($cat_id) {
            wp_set_post_categories($post_id, array($cat_id));
        }
    }
    
    // Címkék (tags) és kulcsszavak kezelése
    if (!empty($params['keywords'])) {
        $keywords = $params['keywords'];
        if (is_string($keywords)) {
            $keywords = array_map('trim', explode(',', $keywords));
        }
        if (is_array($keywords)) {
            $sanitized_keywords = array_map('sanitize_text_field', $keywords);
            wp_set_post_tags($post_id, $sanitized_keywords, false);
        }
    }
    
    // Kiemelt kép (featured image) letöltése és beállítása
    if (!empty($params['featured_image'])) {
        $image_url = esc_url_raw($params['featured_image']);
        wp_ai_suite_set_featured_image_from_url($post_id, $image_url, $title);
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'post_id' => $post_id,
        'permalink' => get_permalink($post_id),
        'message' => 'A cikk sikeresen létrehozva a WordPress-ben!'
    ), 200);
}

// 7. WooCommerce termék publikálás kezelője
function wp_ai_suite_handle_publish_product($request) {
    if (!class_exists('WooCommerce')) {
        return new WP_REST_Response(array('success' => false, 'message' => 'A WooCommerce bővítmény nincs aktiválva ezen az oldalon!'), 400);
    }
    
    $params = $request->get_json_params();
    if (empty($params)) {
        $params = $request->get_body_params();
    }
    
    $title = !empty($params['title']) ? sanitize_text_field($params['title']) : '';
    $description = !empty($params['description']) ? wp_kses_post($params['description']) : '';
    $short_description = !empty($params['short_description']) ? wp_kses_post($params['short_description']) : '';
    $price = isset($params['price']) ? sanitize_text_field($params['price']) : '';
    $regular_price = isset($params['regular_price']) ? sanitize_text_field($params['regular_price']) : $price;
    $sale_price = isset($params['sale_price']) ? sanitize_text_field($params['sale_price']) : '';
    $sku = !empty($params['sku']) ? sanitize_text_field($params['sku']) : '';
    $status = !empty($params['status']) ? sanitize_text_field($params['status']) : 'draft';
    
    if (empty($title)) {
        return new WP_REST_Response(array('success' => false, 'message' => 'A termék neve nem lehet üres!'), 400);
    }
    
    // Termék létrehozása
    $product_id = wp_insert_post(array(
        'post_title'   => $title,
        'post_content' => $description,
        'post_excerpt' => $short_description,
        'post_status'  => $status,
        'post_type'    => 'product',
    ));
    
    if (is_wp_error($product_id)) {
        return new WP_REST_Response(array('success' => false, 'message' => $product_id->get_error_message()), 500);
    }
    
    // WooCommerce metaadatok frissítése
    update_post_meta($product_id, '_visibility', 'visible');
    update_post_meta($product_id, '_stock_status', 'instock');
    
    if ($sku) {
        update_post_meta($product_id, '_sku', $sku);
    }
    if ($regular_price !== '') {
        update_post_meta($product_id, '_regular_price', $regular_price);
        update_post_meta($product_id, '_price', $regular_price);
    }
    if ($sale_price !== '') {
        update_post_meta($product_id, '_sale_price', $sale_price);
        if ($regular_price === '' || floatval($sale_price) < floatval($regular_price)) {
            update_post_meta($product_id, '_price', $sale_price);
        }
    }
    
    // Kategóriák kezelése termékekhez
    if (!empty($params['category'])) {
        $category = sanitize_text_field($params['category']);
        wp_set_object_terms($product_id, $category, 'product_cat');
    }
    
    // Termék kép letöltése és beállítása
    if (!empty($params['image_url'])) {
        $image_url = esc_url_raw($params['image_url']);
        wp_ai_suite_set_featured_image_from_url($product_id, $image_url, $title);
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'product_id' => $product_id,
        'permalink' => get_permalink($product_id),
        'message' => 'A WooCommerce termék sikeresen létrehozva!'
    ), 200);
}

// 8. Segédfüggvény kiemelt kép beállításához külső URL-ből
function wp_ai_suite_set_featured_image_from_url($post_id, $image_url, $title) {
    require_once(ABSPATH . 'wp-admin/includes/media.php');
    require_once(ABSPATH . 'wp-admin/includes/file.php');
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    
    // Letöltés
    $temp_file = download_url($image_url);
    if (is_wp_error($temp_file)) {
        return false;
    }
    
    $file_array = array(
        'name' => basename($image_url),
        'tmp_name' => $temp_file
    );
    
    // Ha nincs kiterjesztése, adjunk hozzá
    if (!preg_match('/\\.(jpg|jpeg|png|gif|webp)$/i', $file_array['name'])) {
        $file_array['name'] .= '.jpg';
    }
    
    // Média könyvtárba helyezés
    $id = media_handle_sideload($file_array, $post_id, $title);
    
    if (is_wp_error($id)) {
        @unlink($temp_file);
        return false;
    }
    
    // Kiemelt képként beállítás
    set_post_thumbnail($post_id, $id);
    return $id;
}
`;

    zip.addFile("wp-ai-suite/wp-ai-suite.php", Buffer.from(phpCode, 'utf-8'), "Main integration file");
    
    const zipBuffer = zip.toBuffer();
    
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=wp-ai-suite-integration.zip");
    res.send(zipBuffer);
  } catch (error: any) {
    console.error("WordPress plugin zip generation failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vite middleware and production serve
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WordPress AI Suite server running on http://localhost:${PORT}`);
  });
}

startServer();
