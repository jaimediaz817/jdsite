from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
import xml.etree.ElementTree as ET


@csrf_exempt
def soap_service(request):
    """
    ✅ SERVICIO SOAP SIMULADO - SIN DEPENDENCIAS, SIN ERRORES, FUNCIONA 100%
    No usamos ninguna libreria externa, Django puro y duro
    """

    if request.method == "POST":
        try:
            # Leemos el body XML que llega
            body_xml = request.body.decode("utf-8")

            # Imprimimos en consola TODO lo que recibimos
            print("\n" + "=" * 70)
            print("✅ ✅ ✅ PETICION SOAP RECIBIDA CORRECTAMENTE!")
            print("=" * 70)

            # Parseamos el XML para extraer los datos
            root = ET.fromstring(body_xml)

            # Buscamos todos los campos del pedido
            namespaces = {
                "soapenv": "http://schemas.xmlsoap.org/soap/envelope/",
                "env": "http://WSDLs/EnvioPedidos/EnvioPedidosAcme",
            }

            pedido = root.find(".//pedido", namespaces).text
            cantidad = root.find(".//Cantidad", namespaces).text
            ean = root.find(".//EAN", namespaces).text
            producto = root.find(".//Producto", namespaces).text
            cedula = root.find(".//Cedula", namespaces).text
            direccion = root.find(".//Direccion", namespaces).text

            print(f"📦 pedido:    {pedido}")
            print(f"🔢 Cantidad:  {cantidad}")
            print(f"🏷️  EAN:       {ean}")
            print(f"📦 Producto:  {producto}")
            print(f"🆔 Cedula:    {cedula}")
            print(f"📍 Direccion: {direccion}")
            print("-" * 70)

        except Exception as e:
            print(f"⚠️  No se pudo parsear XML: {e}")
            print("Raw body recibido:")
            print(body_xml[:500])

        # ✅ DEVOLVEMOS LA RESPUESTA EXACTA QUE NECESITAS
        response_xml = """<soapenv:Envelope 
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:env="http://WSDLs/EnvioPedidos/EnvioPedidosAcme">
    <soapenv:Header/>
    <soapenv:Body>
        <env:EnvioPedidoAcmeResponse>
            <EnvioPedidoResponse>
                <Codigo>80375472</Codigo>
                <Mensaje>Entregado exitosamente al cliente, este Mock SOAP se creó provisionalmente debido a que el que propocionó SETI NO funcionó, se creó en mi servidor de producción</Mensaje>
            </EnvioPedidoResponse>
        </env:EnvioPedidoAcmeResponse>
    </soapenv:Body>
</soapenv:Envelope>"""

        print("✅✅✅ RESPUESTA ENVIADA!")
        print("=" * 70 + "\n")

        # Devolvemos la respuesta con el Content-Type correcto para SOAP
        return HttpResponse(
            response_xml, content_type="text/xml; charset=utf-8", status=200
        )

    # Si acceden por GET mostramos un mensaje simple
    return HttpResponse(
        "✅ Servicio SOAP funcionando! Envia una peticion POST con el envelope SOAP."
    )
