from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import xml.etree.ElementTree as ET
import os

# Указываем root_path на папку выше, чтобы видеть index.html, script.js и style.css
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app = Flask(__name__, static_folder=base_dir, static_url_path='')
CORS(app)

# 1. Отдаем главную страницу
@app.route('/')
def index():
    return send_from_directory(base_dir, 'index.html')

# 2. Отдаем стили, скрипты и всё остальное
@app.route('/<path:path>')
def serve_static_files(path):
    if os.path.exists(os.path.join(base_dir, path)):
        return send_from_directory(base_dir, path)
    return send_from_directory(base_dir, 'index.html')

def parse_element(element):
    tag = element.tag.split('}')[-1] if '}' in element.tag else element.tag
    attributes = {}
    for key, val in element.attrib.items():
        clean_key = key.split('}')[-1] if '}' in key else key
        attributes[clean_key] = val

    children = [parse_element(child) for child in element]
    return {
        "tag": tag,
        "attributes": attributes,
        "children": children
    }

# 3. Сам парсер
@app.route('/api/parse-xml', methods=['POST'])
def parse_xml():
    try:
        data = request.get_json() or {}
        xml_content = data.get('xml', '')
        
        if not xml_content.strip():
            return jsonify({"success": False, "error": "Empty XML"}), 400

        if 'xmlns:android' not in xml_content and '<' in xml_content:
            first_tag_end = xml_content.find('>')
            if first_tag_end != -1:
                xml_content = (
                    xml_content[:first_tag_end] + 
                    ' xmlns:android="http://schemas.android.com/apk/res/android" xmlns:app="http://schemas.android.com/apk/res-auto"' + 
                    xml_content[first_tag_end:]
                )

        root = ET.fromstring(xml_content)
        json_tree = parse_element(root)
        return jsonify({"success": True, "tree": json_tree})

    except ET.ParseError as e:
        return jsonify({"success": False, "error": f"XML Syntax Error: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
