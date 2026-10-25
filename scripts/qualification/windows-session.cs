using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Runtime.CompilerServices;
// Task-scoped AppContainer with no network capabilities. No global firewall changes.
public sealed class EvaluationContainer : IDisposable {
  [StructLayout(LayoutKind.Sequential)] struct SECURITY_CAPABILITIES {public IntPtr Sid,Capabilities;public uint Count,Reserved;}
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] struct STARTUPINFO {public int cb;public string reserved,desktop,title;public int x,y,xSize,ySize,xChars,yChars,fill,flags;public short show,reserved2;public IntPtr reservedPtr,input,output,error;}
  [StructLayout(LayoutKind.Sequential)] struct STARTUPINFOEX {public STARTUPINFO Info;public IntPtr Attributes;}
  [StructLayout(LayoutKind.Sequential)] struct PROCESS_INFORMATION {public IntPtr Process,Thread;public uint Id,ThreadId;}
  [StructLayout(LayoutKind.Sequential)] struct SECURITY_ATTRIBUTES {public int Length;public IntPtr Descriptor;[MarshalAs(UnmanagedType.Bool)]public bool Inherit;}
  [StructLayout(LayoutKind.Sequential)] struct IO_COUNTERS {public ulong r,w,o,rb,wb,ob;}
  [StructLayout(LayoutKind.Sequential)] struct BASIC_LIMIT {public long processTime,jobTime;public uint flags;public UIntPtr minWork,maxWork;public uint active;public UIntPtr affinity;public uint priority,scheduling;}
  [StructLayout(LayoutKind.Sequential)] struct EXTENDED_LIMIT {public BASIC_LIMIT basic;public IO_COUNTERS io;public UIntPtr processMemory,jobMemory,peakProcess,peakJob;}
  [StructLayout(LayoutKind.Sequential)] struct MEMORY_COUNTERS {public uint size,faults;public UIntPtr peakWorking,working,peakPaged,paged,peakNonpaged,nonpaged,pagefile,peakPagefile;}
  [DllImport("userenv.dll",CharSet=CharSet.Unicode)] static extern int CreateAppContainerProfile(string n,string d,string desc,IntPtr caps,uint count,out IntPtr sid);
  [DllImport("userenv.dll",CharSet=CharSet.Unicode)] static extern int DeleteAppContainerProfile(string n);
  [DllImport("advapi32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool ConvertSidToStringSid(IntPtr sid,out IntPtr str);
  [DllImport("advapi32.dll")] static extern IntPtr FreeSid(IntPtr sid);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool OpenProcessToken(IntPtr process,uint access,out IntPtr token);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool GetTokenInformation(IntPtr token,int kind,IntPtr info,uint size,out uint needed);
  [DllImport("kernel32.dll")] static extern IntPtr LocalFree(IntPtr p);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool InitializeProcThreadAttributeList(IntPtr p,int count,int flags,ref IntPtr size);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool UpdateProcThreadAttribute(IntPtr p,uint flags,IntPtr key,IntPtr value,IntPtr size,IntPtr prev,IntPtr ret);
  [DllImport("kernel32.dll")] static extern void DeleteProcThreadAttributeList(IntPtr p);
  [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool CreateProcess(string app,StringBuilder cmd,IntPtr pa,IntPtr ta,bool inherit,uint flags,IntPtr env,string cwd,ref STARTUPINFOEX si,out PROCESS_INFORMATION pi);
  [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr CreateFile(string path,uint access,uint share,ref SECURITY_ATTRIBUTES sa,uint disposition,uint flags,IntPtr template);
  [DllImport("kernel32.dll",SetLastError=true)] static extern IntPtr CreateJobObject(IntPtr sa,string name);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetInformationJobObject(IntPtr job,int kind,ref EXTENDED_LIMIT limit,uint size);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr job,IntPtr process);
  [DllImport("kernel32.dll")] static extern uint ResumeThread(IntPtr thread);
  [DllImport("kernel32.dll")] static extern uint WaitForSingleObject(IntPtr handle,uint ms);
  [DllImport("kernel32.dll")] static extern bool TerminateJobObject(IntPtr job,uint code);
  [DllImport("kernel32.dll")] static extern bool TerminateProcess(IntPtr process,uint code);
  [DllImport("kernel32.dll")] static extern bool GetExitCodeProcess(IntPtr process,out uint code);
  [DllImport("psapi.dll")] static extern bool GetProcessMemoryInfo(IntPtr process,ref MEMORY_COUNTERS info,uint size);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr p);
  readonly string name;readonly IntPtr sid;public string Sid {get;private set;}
  static void Require(bool ok,[CallerArgumentExpression("ok")] string operation=null) {if(!ok){int error=Marshal.GetLastWin32Error();throw new Exception(operation+"; Win32="+error+": "+new Win32Exception(error).Message);}}
  static string Quote(string s) {var b=new StringBuilder("\"");int slashes=0;foreach(char c in s){if(c=='\\'){slashes++;continue;}if(c=='\"'){b.Append('\\',slashes*2+1).Append(c);}else{b.Append('\\',slashes).Append(c);}slashes=0;}return b.Append('\\',slashes*2).Append('"').ToString();}
  public EvaluationContainer(string name) {this.name=name;int hr=CreateAppContainerProfile(name,name,"Temporary validation-only evaluation",IntPtr.Zero,0,out sid);if(hr<0)Marshal.ThrowExceptionForHR(hr);IntPtr text;Require(ConvertSidToStringSid(sid,out text));Sid=Marshal.PtrToStringUni(text);LocalFree(text);}
  public object Run(string command,string[] args,string cwd,Dictionary<string,string> env,string output,int timeout,bool restrictChildren) {
    IntPtr attributes=IntPtr.Zero,size=IntPtr.Zero,caps=IntPtr.Zero,handles=IntPtr.Zero,childPolicy=IntPtr.Zero,environment=IntPtr.Zero,job=IntPtr.Zero;
    IntPtr stdin=IntPtr.Zero,stdout=IntPtr.Zero,stderr=IntPtr.Zero,token=IntPtr.Zero;PROCESS_INFORMATION pi=new PROCESS_INFORMATION();bool started=false;
    try {
      var sa=new SECURITY_ATTRIBUTES {Length=Marshal.SizeOf(typeof(SECURITY_ATTRIBUTES)),Inherit=true};
      stdin=CreateFile("NUL",0x80000000,3,ref sa,3,0,IntPtr.Zero);stdout=CreateFile(output+".out",0x40000000,3,ref sa,2,0,IntPtr.Zero);stderr=CreateFile(output+".err",0x40000000,3,ref sa,2,0,IntPtr.Zero);
      foreach(var h in new[]{stdin,stdout,stderr})Require(h!=new IntPtr(-1));
      InitializeProcThreadAttributeList(IntPtr.Zero,restrictChildren?3:2,0,ref size);attributes=Marshal.AllocHGlobal(size);Require(InitializeProcThreadAttributeList(attributes,restrictChildren?3:2,0,ref size));
      caps=Marshal.AllocHGlobal(Marshal.SizeOf(typeof(SECURITY_CAPABILITIES)));Marshal.StructureToPtr(new SECURITY_CAPABILITIES {Sid=sid},caps,false);
      Require(UpdateProcThreadAttribute(attributes,0,new IntPtr(0x20009),caps,new IntPtr(Marshal.SizeOf(typeof(SECURITY_CAPABILITIES))),IntPtr.Zero,IntPtr.Zero));
      handles=Marshal.AllocHGlobal(IntPtr.Size*3);Marshal.WriteIntPtr(handles,0,stdin);Marshal.WriteIntPtr(handles,IntPtr.Size,stdout);Marshal.WriteIntPtr(handles,IntPtr.Size*2,stderr);
      Require(UpdateProcThreadAttribute(attributes,0,new IntPtr(0x20002),handles,new IntPtr(IntPtr.Size*3),IntPtr.Zero,IntPtr.Zero));
      if(restrictChildren){childPolicy=Marshal.AllocHGlobal(4);Marshal.WriteInt32(childPolicy,1);Require(UpdateProcThreadAttribute(attributes,0,new IntPtr(0x2000e),childPolicy,new IntPtr(4),IntPtr.Zero,IntPtr.Zero));}
      var text=new StringBuilder(Quote(command));foreach(var a in args)text.Append(' ').Append(Quote(a));
      var keys=new List<string>(env.Keys);keys.Sort(StringComparer.OrdinalIgnoreCase);var block=new StringBuilder();foreach(var key in keys){if(key.Contains("=")||key.Contains("\0")||env[key].Contains("\0"))throw new Exception("Invalid environment");block.Append(key).Append('=').Append(env[key]).Append('\0');}block.Append('\0');environment=Marshal.StringToHGlobalUni(block.ToString());
      var si=new STARTUPINFOEX {Info=new STARTUPINFO {cb=Marshal.SizeOf(typeof(STARTUPINFOEX)),flags=0x100,input=stdin,output=stdout,error=stderr},Attributes=attributes};
      Require(CreateProcess(command,text,IntPtr.Zero,IntPtr.Zero,true,0x80000|0x400|4,environment,cwd,ref si,out pi));started=true;
      Require(OpenProcessToken(pi.Process,8,out token));uint needed;IntPtr tokenFlag=Marshal.AllocHGlobal(4);bool isContainer;
      try{Require(GetTokenInformation(token,29,tokenFlag,4,out needed));isContainer=Marshal.ReadInt32(tokenFlag)!=0;}finally{Marshal.FreeHGlobal(tokenFlag);}
      GetTokenInformation(token,30,IntPtr.Zero,0,out needed);IntPtr capabilities=Marshal.AllocHGlobal((int)needed);int capabilityCount;
      try{Require(GetTokenInformation(token,30,capabilities,needed,out needed));capabilityCount=Marshal.ReadInt32(capabilities);}finally{Marshal.FreeHGlobal(capabilities);}
      if(!isContainer||capabilityCount!=0)throw new Exception("Inactive container token or unexpected capabilities");
      job=CreateJobObject(IntPtr.Zero,null);Require(job!=IntPtr.Zero);var limits=new EXTENDED_LIMIT {basic=new BASIC_LIMIT {flags=0x2000|0x100},processMemory=new UIntPtr(1024UL*1024*1024)};
      Require(SetInformationJobObject(job,9,ref limits,(uint)Marshal.SizeOf(typeof(EXTENDED_LIMIT))));Require(AssignProcessToJobObject(job,pi.Process));Require(ResumeThread(pi.Thread)!=0xffffffff);
      bool timedOut=WaitForSingleObject(pi.Process,(uint)timeout)==0x102;if(timedOut){TerminateJobObject(job,124);WaitForSingleObject(pi.Process,5000);}
      uint code;Require(GetExitCodeProcess(pi.Process,out code));var memory=new MEMORY_COUNTERS {size=(uint)Marshal.SizeOf(typeof(MEMORY_COUNTERS))};Require(GetProcessMemoryInfo(pi.Process,ref memory,memory.size));
      CloseHandle(stdout);stdout=IntPtr.Zero;CloseHandle(stderr);stderr=IntPtr.Zero;
      return new {exitCode=(long)code,timedOut=timedOut,peakMemoryBytes=memory.peakWorking.ToUInt64(),appContainer=isContainer,capabilityCount=capabilityCount,stdout=File.ReadAllText(output+".out",Encoding.UTF8),stderr=File.ReadAllText(output+".err",Encoding.UTF8)};
    } finally {
      if(started&&pi.Process!=IntPtr.Zero)TerminateProcess(pi.Process,125);
      foreach(var h in new[]{pi.Thread,pi.Process,stdin,stdout,stderr,job,token})if(h!=IntPtr.Zero&&h!=new IntPtr(-1))CloseHandle(h);
      if(attributes!=IntPtr.Zero){DeleteProcThreadAttributeList(attributes);Marshal.FreeHGlobal(attributes);}foreach(var p in new[]{caps,handles,childPolicy,environment})if(p!=IntPtr.Zero)Marshal.FreeHGlobal(p);
      foreach(var f in new[]{output+".out",output+".err"})if(File.Exists(f))File.Delete(f);
    }
  }
  public void Dispose(){DeleteAppContainerProfile(name);FreeSid(sid);}
}
