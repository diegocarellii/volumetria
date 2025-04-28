from bibliotecas import *

#=====================================================================================

app = Flask(__name__)
app.static_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
app.template_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pages_py')

from rotes import *


if __name__ == "__main__":
    app.run(debug=True, port=5000)