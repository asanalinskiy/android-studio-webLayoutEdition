from flask import Flask, request, jsonify
from flask_cors import CORS
import xml.etree.ElementTree as ET

app = Flask(__name__)
CORS(app)

def parse_element(element):
    # Убираем namespaces из тегов (например, android:LinearLayout -> LinearLayout)
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

@app.route('/api/parse-xml', methods=['POST'])
def parse_xml():
    try:
        data = request.get_json() or {}
        xml_content = data.get('xml', '')
        
        if not xml_content.strip():
            return jsonify({"success": False, "error": "Empty XML"}), 400

        # Автоматически подставляем namespace android, если его забыли
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
