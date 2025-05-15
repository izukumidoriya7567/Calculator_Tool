import {ChatGroq} from "@langchain/groq";
import {z} from "zod";
import {tool} from "@langchain/core/tools";
import {HumanMessage,SystemMessage} from "@langchain/core/messages";
//First and foremost we have instantiated the model by the apiKey, chosen the model already
const llm=new ChatGroq({
    apiKey:process.env.API_KEY,
    model:"llama-3.3-70b-versatile",
    temperature:1.0,// basically this controls the creativity of the model
});

// Schema of what the tool will require, their data types and their use case.
const calculatorSchema=z.object({
    operation:z.enum(["add","subtract","multiply","divide"]).describe("Performs mathematical operations"),
    number1:z.number().describe("First number to be operated on"),
    number2:z.number().describe("Second Number to be operated on"),
})

//Tool which will be called upon when the model deems so!
const calculatorTool=tool(
    async({operation,number1,number2})=>{
        if(operation==="add"){
            return `${number1+number2}`;
        }
        else if(operation==="subtract"){
            return `${number1-number2}`;
        }
        else if(operation==="multiply"){
            return `${number1*number2}`;
        }
        else if(operation==="divide"){
            return `${number1/number2}`;
        }
        else{
            return "Error";
        }
    },
    {
        name:"calculator",
        description:"Performs mathematical Operations",
        schema:calculatorSchema, //schema has been provided, along with name of the tool and what it does !
    }
)

const messages=[
    new SystemMessage("Follow BODMAS rule, first take care of all the brackets, then all the powers in the indices, then division and so on."),
    new HumanMessage("What is 4+5+6+7+8+9 ?"),// whatever you wanna ask from the BigBossy LLM, write it here
]

const llmWithTools=llm.bindTools([calculatorTool]);
//you have given access of the Tool to the LLM, now it will use it to carry out it's work.
const aiMessage=await llmWithTools.invoke(messages);
// LLM will tell what tools to call for different cases, here it means for different operators, and differnet number sets.
// It will call the same tool, but the operator and numbers might be different.
messages.push(aiMessage);
console.log(aiMessage);
//Now in aiMessages you will get the access of tool_Calls, what tools are being called by The LLM
//What are their results.
const toolByName={
    calculator:calculatorTool,
} 
for(const toolCall of aiMessage.tool_calls){
    const selectedTool=toolByName[toolCall.name];
    const toolMessage=await selectedTool.invoke(toolCall);
    messages.push(toolMessage);
    console.log(toolMessage);
}
const ans=await llmWithTools.invoke(messages);
console.log(ans);