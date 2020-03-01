<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:template match="/">
		<html>
			<head>
			</head>
			<body>
				<table border="1">
					<tr bgcolor="#9acd32">
						<th>Image</th>
						<th>Description</th>
						<th>Price</th>
					</tr>
					<xsl:for-each select="data/item">
						<tr>
							<td>
								<img>
									<xsl:attribute name="src">
							        	<xsl:value-of select="@imageUrl"/>
							    	</xsl:attribute>
							    </img>
							</td>
							<td><xsl:value-of select="@description"/></td>
							<td><xsl:value-of select="@cost"/></td>
						</tr>
					</xsl:for-each>
				</table>
			</body>
		</html>
	</xsl:template>
</xsl:stylesheet>