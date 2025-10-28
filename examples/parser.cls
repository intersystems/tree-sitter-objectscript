Class Parser.Test {

    ClassMethod GetTransformations(gatewayName As %String) As %String
    {
        Set stmt = ##class(%SQL.Statement).%New()
        Set query = "SELECT * FROM JSON_TABLE(transformations FORMAT COLLECTION, '$' COLUMNS(run_id INT path '$.runId',error VARCHAR(300) path '$.error', error_size INT path '$.error.size()', allFields VARCHAR(4000) path '$')) WHERE error_size > 0"
        Set sc = stmt.%Prepare(query)
        Set rs = stmt.%Execute()
        // Display Metadata
        Do stmt.%Metadata.%Display()
        Set md = stmt.%Metadata
        Set columns = md.columnsGet()
        Set columnCount = md.columnCountGet()
        // Columns are id,_documentID,_documentVersion,run_id,error,error_size,allFields
        Set columnList  = ##class(%ListOfDataTypes).%New()
        For i=1:1:columnCount {
            Set col = columns.GetAt(i)
            Set name     = col.colNameGet()
            Do columnList.Insert(name)
        }

        Set dataList = ##class(%ListOfDataTypes).%New()
        While rs.%Next() {
        Set rowList = ##class(%ListOfDataTypes).%New()
        For j=1:1:columnCount {
            Set val = rs.%GetData(j)
            Do rowList.Insert(val)
        }
        Do dataList.Insert(rowList)
        }
        Set sc = ##class(barricade.PythonInstall).Install()
        set gateway = $system.external.getPythonGateway()
        set gatewayName = gateway.languageServerNameGet()
        set processed = ..ProcessTable(gatewayName, columnList, dataList)
        set jsonObject = ##class(%DynamicObject).%FromJSON(processed)
        set testJSON = jsonObject.%ToJSON()
        Quit testJSON
    }
}